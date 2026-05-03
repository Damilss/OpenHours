/**
 * Topic-based resource suggestions.
 *
 * Maps detected struggle topics to curated external resources
 * (videos, articles, interactive tools) that students can use
 * alongside the AI hints.
 */

export interface Resource {
  title: string;
  url: string;
  type: "video" | "article" | "interactive" | "textbook";
}

const TOPIC_RESOURCES: Record<string, Resource[]> = {
  Recursion: [
    { title: "Khan Academy — Recursive Algorithms", url: "https://www.khanacademy.org/computing/computer-science/algorithms/recursive-algorithms/a/recursion", type: "article" },
    { title: "Visualgo — Recursion Tree Visualizer", url: "https://visualgo.net/en/recursion", type: "interactive" },
  ],
  "Sorting Algorithms": [
    { title: "Visualgo — Sorting Animations", url: "https://visualgo.net/en/sorting", type: "interactive" },
    { title: "GeeksforGeeks — Sorting Algorithms Overview", url: "https://www.geeksforgeeks.org/sorting-algorithms/", type: "article" },
  ],
  "Search Algorithms": [
    { title: "Khan Academy — Binary Search", url: "https://www.khanacademy.org/computing/computer-science/algorithms/binary-search/a/binary-search", type: "article" },
    { title: "CS50 — Binary Search Explained (YouTube)", url: "https://www.youtube.com/watch?v=T98PIp4omUA", type: "video" },
  ],
  "Loops & Iteration": [
    { title: "MDN — Loops and Iteration", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Loops_and_iteration", type: "article" },
    { title: "Python Tutor — Visualize Loop Execution", url: "https://pythontutor.com/", type: "interactive" },
  ],
  "Arrays & Lists": [
    { title: "Visualgo — Linked List Visualization", url: "https://visualgo.net/en/list", type: "interactive" },
    { title: "GeeksforGeeks — Arrays in Data Structures", url: "https://www.geeksforgeeks.org/array-data-structure/", type: "article" },
  ],
  "Pointers & Memory": [
    { title: "Stanford CS Library — Pointers and Memory", url: "http://cslibrary.stanford.edu/102/PointersAndMemory.pdf", type: "textbook" },
    { title: "C Programming — Pointers Explained (YouTube)", url: "https://www.youtube.com/watch?v=zuegQmMdy8M", type: "video" },
  ],
  Trees: [
    { title: "Visualgo — Binary Search Tree", url: "https://visualgo.net/en/bst", type: "interactive" },
    { title: "GeeksforGeeks — Tree Data Structure", url: "https://www.geeksforgeeks.org/introduction-to-tree-data-structure/", type: "article" },
  ],
  Graphs: [
    { title: "Visualgo — Graph Traversal (BFS/DFS)", url: "https://visualgo.net/en/dfsbfs", type: "interactive" },
    { title: "Khan Academy — Graph Representation", url: "https://www.khanacademy.org/computing/computer-science/algorithms/graph-representation/a/representing-graphs", type: "article" },
  ],
  "Stacks & Queues": [
    { title: "Visualgo — Stack & Queue", url: "https://visualgo.net/en/list", type: "interactive" },
    { title: "GeeksforGeeks — Stack vs Queue", url: "https://www.geeksforgeeks.org/difference-between-stack-and-queue-data-structures/", type: "article" },
  ],
  "Time Complexity": [
    { title: "Khan Academy — Asymptotic Notation", url: "https://www.khanacademy.org/computing/computer-science/algorithms/asymptotic-notation/a/asymptotic-notation", type: "article" },
    { title: "Big-O Cheat Sheet", url: "https://www.bigocheatsheet.com/", type: "interactive" },
  ],
  Derivatives: [
    { title: "Khan Academy — Derivative Rules", url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-differentiation-1-new", type: "article" },
    { title: "3Blue1Brown — Essence of Calculus: Derivatives (YouTube)", url: "https://www.youtube.com/watch?v=9vKqVkMQHKk", type: "video" },
  ],
  Integrals: [
    { title: "Khan Academy — Integrals", url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-integration-new", type: "article" },
    { title: "3Blue1Brown — Integration and the Fundamental Theorem (YouTube)", url: "https://www.youtube.com/watch?v=rfG8ce4nNh0", type: "video" },
  ],
  "Limits & Continuity": [
    { title: "Khan Academy — Limits and Continuity", url: "https://www.khanacademy.org/math/ap-calculus-ab/ab-limits-new", type: "article" },
    { title: "Desmos Graphing Calculator — Visualize Limits", url: "https://www.desmos.com/calculator", type: "interactive" },
  ],
  "Linear Algebra": [
    { title: "3Blue1Brown — Essence of Linear Algebra (YouTube)", url: "https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab", type: "video" },
    { title: "Khan Academy — Matrices", url: "https://www.khanacademy.org/math/precalculus/x9e81a4f98389efdf:matrices", type: "article" },
  ],
  "Forces & Newton's Laws": [
    { title: "Khan Academy — Newton's Laws of Motion", url: "https://www.khanacademy.org/science/physics/forces-newtons-laws", type: "article" },
    { title: "PhET — Forces and Motion Simulation", url: "https://phet.colorado.edu/en/simulations/forces-and-motion-basics", type: "interactive" },
  ],
  "Energy & Conservation": [
    { title: "Khan Academy — Work and Energy", url: "https://www.khanacademy.org/science/physics/work-and-energy", type: "article" },
    { title: "PhET — Energy Skate Park Simulation", url: "https://phet.colorado.edu/en/simulations/energy-skate-park-basics", type: "interactive" },
  ],
  "Waves & Oscillations": [
    { title: "Khan Academy — Oscillations and Waves", url: "https://www.khanacademy.org/science/physics/mechanical-waves-and-sound", type: "article" },
    { title: "PhET — Wave on a String Simulation", url: "https://phet.colorado.edu/en/simulations/wave-on-a-string", type: "interactive" },
  ],
  Circuits: [
    { title: "Khan Academy — Circuits", url: "https://www.khanacademy.org/science/physics/circuits-topic", type: "article" },
    { title: "PhET — Circuit Construction Kit", url: "https://phet.colorado.edu/en/simulations/circuit-construction-kit-dc", type: "interactive" },
  ],
  Momentum: [
    { title: "Khan Academy — Momentum and Impulse", url: "https://www.khanacademy.org/science/physics/linear-momentum", type: "article" },
    { title: "PhET — Collision Lab Simulation", url: "https://phet.colorado.edu/en/simulations/collision-lab", type: "interactive" },
  ],
  "Free Body Diagrams": [
    { title: "Khan Academy — Free Body Diagrams", url: "https://www.khanacademy.org/science/physics/forces-newtons-laws/normal-contact-force/v/force-of-friction-keeping-the-block-stationary", type: "article" },
    { title: "The Physics Classroom — Drawing Free-Body Diagrams", url: "https://www.physicsclassroom.com/class/newtlaws/Lesson-2/Drawing-Free-Body-Diagrams", type: "article" },
  ],
};

const RESOURCE_TYPE_EMOJI: Record<string, string> = {
  video: "🎥",
  article: "📖",
  interactive: "🧪",
  textbook: "📚",
};

export function getResourcesForTopic(topic: string): Resource[] {
  return TOPIC_RESOURCES[topic] ?? [];
}

export function formatResourceEmoji(type: Resource["type"]): string {
  return RESOURCE_TYPE_EMOJI[type] ?? "📎";
}
