const express = require('express');

class Graph {
    constructor() {
        this.adjacencyList = {};
    }

    addVertex(vertex) {
        if (!this.adjacencyList[vertex]) this.adjacencyList[vertex] = [];
    }

    addEdge(vertex1, vertex2, weight) {
        this.adjacencyList[vertex1].push({ node: vertex2, weight });
        this.adjacencyList[vertex2].push({ node: vertex1, weight });
    }

    bellmanFordShortestPath(start, end) {
        const distances = {};
        const previous = {};
        const vertices = Object.keys(this.adjacencyList);

        for (let vertex of vertices) {
            distances[vertex] = Infinity;
            previous[vertex] = null;
        }

        distances[start] = 0;

        for (let i = 0; i < vertices.length - 1; i++) {
            for (let vertex of vertices) {
                for (let neighbor of this.adjacencyList[vertex]) {
                    const { node, weight } = neighbor;
                    if (distances[vertex] + weight < distances[node]) {
                        distances[node] = distances[vertex] + weight;
                        previous[node] = vertex;
                    }
                }
            }
        }

        const shortestPath = [];
        let currentNode = end;

        while (currentNode) {
            shortestPath.push(currentNode);
            currentNode = previous[currentNode];
        }

        return shortestPath.reverse();
    }

    calculateEDA() {
        const numVertices = Object.keys(this.adjacencyList).length;
        let numEdges = 0;

        for (let vertex in this.adjacencyList) {
            numEdges += this.adjacencyList[vertex].length;
        }
        numEdges /= 2;

        return { numVertices, numEdges };
    }

    calculateRadius() {
        const eccentricities = {};

        for (let vertex of Object.keys(this.adjacencyList)) {
            let maxDistance = -Infinity;

            for (let target of Object.keys(this.adjacencyList)) {
                if (vertex !== target) {
                    const path = this.bellmanFordShortestPath(vertex, target);
                    const distance = path.length > 1 ? path.length - 1 : Infinity;
                    maxDistance = Math.max(maxDistance, distance);
                }
            }
            eccentricities[vertex] = maxDistance;
        }

        return Math.min(...Object.values(eccentricities));
    }

    calculateMatchPercentage(passengers, shortestRoute) {
        let totalDistance = 0;
        for (let i = 0; i < shortestRoute.length - 1; i++) {
            const current = shortestRoute[i];
            const next = shortestRoute[i + 1];
            const edge = this.adjacencyList[current].find(neighbor => neighbor.node === next);
            if (edge) totalDistance += edge.weight;
        }

        const matchPercentages = {};
        passengers.forEach((passenger) => {
            const pathToPassenger = this.bellmanFordShortestPath(shortestRoute[0], passenger);
            let passengerDistance = 0;
            for (let i = 0; i < pathToPassenger.length - 1; i++) {
                const current = pathToPassenger[i];
                const next = pathToPassenger[i + 1];
                const edge = this.adjacencyList[current].find(neighbor => neighbor.node === next);
                if (edge) passengerDistance += edge.weight;
            }

            const matchPercentage = 100 - (passengerDistance / totalDistance) * 100;
            matchPercentages[passenger] = Math.max(0, matchPercentage);
        });

        return matchPercentages;
    }
}

const locations = {
    driver: "Juan",
    destination: "Makati"
};

function findShortestRouteWithPassengers(graph, driver, passengers, destination) {
    let currentLocation = driver;
    let route = [driver];
    
    passengers.forEach((passenger) => {
        let nextLeg = graph.bellmanFordShortestPath(currentLocation, passenger);
        route = route.concat(nextLeg.slice(1));
        currentLocation = passenger;
    });

    let finalLeg = graph.bellmanFordShortestPath(currentLocation, destination);
    route = route.concat(finalLeg.slice(1));

    return route;
}

const app = express();
app.use(express.json());

app.post('/shortest-route', (req, res) => {
    const { passengers } = req.body;
    if (!passengers || !Array.isArray(passengers)) {
        return res.status(400).json({ error: "Passengers must be provided as an array." });
    }

    let graph = new Graph();
    Object.values(locations).forEach((loc) => graph.addVertex(loc));
    passengers.forEach(passenger => graph.addVertex(passenger));

    graph.addEdge("Juan", "Maria", 5);
    graph.addEdge("Juan", "Jose", 10);
    graph.addEdge("Juan", "Ana", 8);
    graph.addEdge("Maria", "Jose", 3);
    graph.addEdge("Maria", "Ana", 7);
    graph.addEdge("Jose", "Ana", 2);
    graph.addEdge("Ana", "Makati", 4);
    graph.addEdge("Jose", "Makati", 6);
    graph.addEdge("Maria", "Makati", 9);

    const shortestRoute = findShortestRouteWithPassengers(graph, locations.driver, passengers, locations.destination);

    const eda = graph.calculateEDA();
    const radius = graph.calculateRadius();
    const matchPercentages = graph.calculateMatchPercentage(passengers, shortestRoute);

    res.json({
        message: "Shortest Route for the Driver",
        route: shortestRoute,
        eda,
        radius,
        matchPercentages
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
