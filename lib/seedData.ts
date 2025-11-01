import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { ReactFlowData, Level } from '@/types';

const seedCourses = async () => {
  console.log('Starting seed process...');

  // Course 1: Intro to Machine Learning
  const mlCourseId = doc(collection(db, 'courses')).id;
  const mlGraphData: ReactFlowData = {
    nodes: [
      {
        id: 'what-is-ml',
        type: 'default',
        position: { x: 250, y: 100 },
        data: { label: 'What is ML?' },
      },
      {
        id: 'supervised-learning',
        type: 'default',
        position: { x: 100, y: 250 },
        data: { label: 'Supervised Learning (Regression)' },
      },
      {
        id: 'unsupervised-learning',
        type: 'default',
        position: { x: 400, y: 250 },
        data: { label: 'Unsupervised Learning (Clustering)' },
      },
      {
        id: 'first-model',
        type: 'default',
        position: { x: 250, y: 400 },
        data: { label: 'Your First Model' },
      },
    ],
    edges: [
      { id: 'e1', source: 'what-is-ml', target: 'supervised-learning' },
      { id: 'e2', source: 'what-is-ml', target: 'unsupervised-learning' },
      { id: 'e3', source: 'supervised-learning', target: 'first-model' },
      { id: 'e4', source: 'unsupervised-learning', target: 'first-model' },
    ],
  };

  await setDoc(doc(db, 'courses', mlCourseId), {
    title: 'Intro to Machine Learning',
    description:
      'Learn the fundamentals of machine learning, from basic concepts to building your first model. Understand supervised and unsupervised learning approaches.',
    creatorId: 'system',
    type: 'platform_official',
    graphData: JSON.stringify(mlGraphData),
    createdAt: serverTimestamp(),
  });

  // ML Levels
  const mlLevels: Record<string, Omit<Level, 'id'>> = {
    'what-is-ml': {
      title: 'What is Machine Learning?',
      studyMaterials: [
        {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=ukzFI9rgwfU',
          title: 'Machine Learning Basics',
        },
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Machine_learning',
          title: 'Wikipedia: Machine Learning',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is the main difference between Machine Learning and traditional programming?',
          options: [
            'ML uses algorithms, traditional programming does not',
            'ML learns from data, traditional programming follows explicit instructions',
            'ML is faster than traditional programming',
            'ML only works with numbers',
          ],
          correctIndex: 1,
        },
        {
          question: 'Which of the following is NOT a type of Machine Learning?',
          options: ['Supervised Learning', 'Unsupervised Learning', 'Reinforcement Learning', 'Explicit Learning'],
          correctIndex: 3,
        },
        {
          question: 'What does AI stand for in the context of Machine Learning?',
          options: [
            'Automated Intelligence',
            'Artificial Intelligence',
            'Advanced Integration',
            'Algorithmic Instruction',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        "This level introduces Machine Learning as a subset of AI. It covers the core idea of 'training' a model on data rather than explicit programming. Differentiates between AI, ML, and Deep Learning. Explains how ML systems improve through experience and can make predictions or decisions based on data patterns. Covers basic concepts like features, labels, training data, and the learning process.",
    },
    'supervised-learning': {
      title: 'Supervised Learning (Regression)',
      studyMaterials: [
        {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=kE5QZ8G_78c',
          title: 'Supervised Learning Explained',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is the main characteristic of supervised learning?',
          options: [
            'No labeled data is needed',
            'The algorithm learns from labeled training data',
            'It only works with images',
            'It requires no training phase',
          ],
          correctIndex: 1,
        },
        {
          question: 'Which task is an example of regression?',
          options: [
            'Classifying emails as spam or not spam',
            'Predicting house prices',
            'Grouping customers by behavior',
            'Playing chess',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'Supervised learning is a type of machine learning where the algorithm learns from labeled training data. This level focuses on regression, which predicts continuous numerical values. Explains how regression models find relationships between input features and target variables. Covers linear regression basics, loss functions, and how models are trained to minimize prediction errors. Includes examples like predicting prices, temperatures, or any continuous value.',
    },
    'unsupervised-learning': {
      title: 'Unsupervised Learning (Clustering)',
      studyMaterials: [
        {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=8dqd2fB1sps',
          title: 'Unsupervised Learning Basics',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is the key difference between supervised and unsupervised learning?',
          options: [
            'Supervised learning is faster',
            'Unsupervised learning works with unlabeled data',
            'Unsupervised learning requires more data',
            'Supervised learning is more accurate',
          ],
          correctIndex: 1,
        },
        {
          question: 'What is clustering?',
          options: [
            'Predicting future values',
            'Grouping similar data points together',
            'Removing outliers from data',
            'Labeling data automatically',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'Unsupervised learning works with unlabeled data to find hidden patterns. Clustering is a key technique that groups similar data points together. This level explains how clustering algorithms like K-means work, how they identify natural groupings in data, and their applications. Covers the concept of similarity measures, cluster centers, and how to determine the optimal number of clusters. Includes real-world examples like customer segmentation, image compression, and anomaly detection.',
    },
    'first-model': {
      title: 'Your First Model',
      studyMaterials: [
        {
          type: 'youtube',
          url: 'https://www.youtube.com/watch?v=aircAruvnKk',
          title: 'Building Your First ML Model',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is typically the first step in building a machine learning model?',
          options: [
            'Deploy the model',
            'Collect and prepare data',
            'Choose a complex algorithm',
            'Test on production data',
          ],
          correctIndex: 1,
        },
        {
          question: 'Why is it important to split data into training and testing sets?',
          options: [
            'To use less data',
            'To evaluate how well the model generalizes to new data',
            'To make training faster',
            'To reduce computation cost',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'This level guides students through building their first machine learning model from scratch. Covers the complete workflow: data collection and preprocessing, feature selection, choosing an appropriate algorithm, training the model, evaluating performance, and interpreting results. Explains important concepts like train-test split, overfitting, underfitting, and model validation. Provides a hands-on understanding of the machine learning pipeline and best practices for model development.',
    },
  };

  for (const [levelId, levelData] of Object.entries(mlLevels)) {
    await setDoc(doc(db, 'courses', mlCourseId, 'levels', levelId), levelData);
  }

  // Course 2: Foundations of Quantum Mechanics
  const qmCourseId = doc(collection(db, 'courses')).id;
  const qmGraphData: ReactFlowData = {
    nodes: [
      {
        id: 'classical-vs-quantum',
        type: 'default',
        position: { x: 250, y: 100 },
        data: { label: 'Classical vs. Quantum' },
      },
      {
        id: 'wave-particle',
        type: 'default',
        position: { x: 100, y: 250 },
        data: { label: 'Wave-Particle Duality' },
      },
      {
        id: 'superposition-entanglement',
        type: 'default',
        position: { x: 400, y: 250 },
        data: { label: 'Superposition & Entanglement' },
      },
      {
        id: 'schrodinger-cat',
        type: 'default',
        position: { x: 250, y: 400 },
        data: { label: "Schrödinger's Cat" },
      },
    ],
    edges: [
      { id: 'e1', source: 'classical-vs-quantum', target: 'wave-particle' },
      { id: 'e2', source: 'classical-vs-quantum', target: 'superposition-entanglement' },
      { id: 'e3', source: 'wave-particle', target: 'schrodinger-cat' },
      { id: 'e4', source: 'superposition-entanglement', target: 'schrodinger-cat' },
    ],
  };

  await setDoc(doc(db, 'courses', qmCourseId), {
    title: 'Foundations of Quantum Mechanics',
    description:
      'Explore the fascinating world of quantum mechanics, from wave-particle duality to quantum entanglement and famous thought experiments.',
    creatorId: 'system',
    type: 'platform_official',
    graphData: JSON.stringify(qmGraphData),
    createdAt: serverTimestamp(),
  });

  const qmLevels: Record<string, Omit<Level, 'id'>> = {
    'classical-vs-quantum': {
      title: 'Classical vs. Quantum',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Quantum_mechanics',
          title: 'Introduction to Quantum Mechanics',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is the main difference between classical and quantum physics?',
          options: [
            'Classical physics is older',
            'Quantum physics deals with discrete energy levels and probabilities',
            'Classical physics is more accurate',
            'Quantum physics only applies to large objects',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'This level introduces the fundamental differences between classical and quantum physics. Classical physics describes deterministic behavior of macroscopic objects, while quantum mechanics governs the probabilistic behavior of particles at the atomic and subatomic level. Explains how quantum mechanics revolutionized our understanding of the physical world, introducing concepts like quantized energy, wave functions, and the uncertainty principle.',
    },
    'wave-particle': {
      title: 'Wave-Particle Duality',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Wave%E2%80%93particle_duality',
          title: 'Wave-Particle Duality',
        },
      ],
      mcqQuiz: [
        {
          question: 'What does wave-particle duality mean?',
          options: [
            'Particles are always waves',
            'Quantum objects exhibit both wave and particle properties',
            'Waves and particles are the same thing',
            'Only light shows this behavior',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'Wave-particle duality is a fundamental concept in quantum mechanics stating that quantum entities exhibit both wave-like and particle-like properties. This level explains the double-slit experiment, de Broglie hypothesis, and how the same entity can behave as a wave or particle depending on how it is observed. Covers the mathematical description through wave functions and the physical implications of this dual nature.',
    },
    'superposition-entanglement': {
      title: 'Superposition & Entanglement',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Quantum_superposition',
          title: 'Quantum Superposition',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is quantum superposition?',
          options: [
            'Particles existing in multiple places at once',
            'A particle existing in multiple states simultaneously until measured',
            'Waves interfering with each other',
            'Classical physics phenomenon',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'Quantum superposition allows particles to exist in multiple states simultaneously until measured. Quantum entanglement is a phenomenon where particles become correlated in such a way that measuring one instantly affects the other, regardless of distance. This level explores these mind-bending concepts, their mathematical foundations, experimental verification, and potential applications in quantum computing and communication.',
    },
    'schrodinger-cat': {
      title: "Schrödinger's Cat",
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Schr%C3%B6dinger%27s_cat',
          title: "Schrödinger's Cat Thought Experiment",
        },
      ],
      mcqQuiz: [
        {
          question: "What does Schrödinger's Cat illustrate?",
          options: [
            'Cats in quantum states',
            'The problem of quantum superposition at macroscopic scales',
            'How to build quantum computers',
            'Classical physics principles',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        "Schrödinger's Cat is a famous thought experiment that highlights the apparent paradox of quantum superposition when applied to macroscopic objects. This level explains the thought experiment, its purpose in illustrating the Copenhagen interpretation, and modern perspectives on quantum measurement and decoherence. Discusses how this thought experiment continues to inspire discussions about the nature of reality and the measurement problem in quantum mechanics.",
    },
  };

  for (const [levelId, levelData] of Object.entries(qmLevels)) {
    await setDoc(doc(db, 'courses', qmCourseId, 'levels', levelId), levelData);
  }

  // Course 3: Database Management Systems
  const dbmsCourseId = doc(collection(db, 'courses')).id;
  const dbmsGraphData: ReactFlowData = {
    nodes: [
      {
        id: 'what-is-database',
        type: 'default',
        position: { x: 250, y: 100 },
        data: { label: 'What is a Database?' },
      },
      {
        id: 'relational-models',
        type: 'default',
        position: { x: 100, y: 250 },
        data: { label: 'Relational Models (SQL)' },
      },
      {
        id: 'nosql-models',
        type: 'default',
        position: { x: 400, y: 250 },
        data: { label: 'NoSQL Models' },
      },
      {
        id: 'acid-transactions',
        type: 'default',
        position: { x: 250, y: 400 },
        data: { label: 'ACID Transactions' },
      },
    ],
    edges: [
      { id: 'e1', source: 'what-is-database', target: 'relational-models' },
      { id: 'e2', source: 'what-is-database', target: 'nosql-models' },
      { id: 'e3', source: 'relational-models', target: 'acid-transactions' },
      { id: 'e4', source: 'nosql-models', target: 'acid-transactions' },
    ],
  };

  await setDoc(doc(db, 'courses', dbmsCourseId), {
    title: 'Database Management Systems (DBMS)',
    description:
      'Master database fundamentals, from relational SQL databases to NoSQL systems and transaction management principles.',
    creatorId: 'system',
    type: 'platform_official',
    graphData: JSON.stringify(dbmsGraphData),
    createdAt: serverTimestamp(),
  });

  const dbmsLevels: Record<string, Omit<Level, 'id'>> = {
    'what-is-database': {
      title: 'What is a Database?',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Database',
          title: 'Database Fundamentals',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is the primary purpose of a database?',
          options: [
            'To store data permanently',
            'To organize, store, and retrieve data efficiently',
            'To create web pages',
            'To process transactions only',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'This level introduces databases as organized collections of data. Explains the need for databases in managing large amounts of information, data integrity, concurrent access, and data relationships. Covers basic concepts like tables, records, fields, and the role of Database Management Systems (DBMS) in providing data management capabilities.',
    },
    'relational-models': {
      title: 'Relational Models (SQL)',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Relational_database',
          title: 'Relational Database Model',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is a key feature of relational databases?',
          options: [
            'They store data in tables with relationships',
            'They only work with documents',
            'They have no structure',
            'They are slower than other databases',
          ],
          correctIndex: 0,
        },
      ],
      aiQuizContext:
        'Relational databases organize data into tables with rows and columns, using SQL for querying and manipulation. This level covers the relational model, primary keys, foreign keys, normalization, and SQL basics. Explains how relational databases maintain data integrity through relationships and constraints, and their advantages in structured data management.',
    },
    'nosql-models': {
      title: 'NoSQL Models',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/NoSQL',
          title: 'NoSQL Databases',
        },
      ],
      mcqQuiz: [
        {
          question: 'What does NoSQL stand for?',
          options: [
            'No Structured Query Language',
            'Not Only SQL',
            'No SQL databases',
            'New SQL',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'NoSQL databases provide alternative data models to relational databases, including document stores, key-value stores, column-family stores, and graph databases. This level explains when to use NoSQL, its advantages in scalability and flexibility, different NoSQL types, and their use cases in modern applications, especially for big data and distributed systems.',
    },
    'acid-transactions': {
      title: 'ACID Transactions',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/ACID',
          title: 'ACID Properties',
        },
      ],
      mcqQuiz: [
        {
          question: 'What does ACID stand for?',
          options: [
            'Atomic, Consistent, Isolated, Durable',
            'Automatic, Continuous, Integrated, Dynamic',
            'Advanced, Complex, Intelligent, Direct',
            'All, Complete, Individual, Direct',
          ],
          correctIndex: 0,
        },
      ],
      aiQuizContext:
        'ACID (Atomicity, Consistency, Isolation, Durability) properties ensure reliable database transactions. This level explains each property in detail: atomicity (all-or-nothing execution), consistency (valid state transitions), isolation (concurrent transactions), and durability (persistent changes). Covers how these properties are implemented, trade-offs in distributed systems, and their importance in maintaining data integrity.',
    },
  };

  for (const [levelId, levelData] of Object.entries(dbmsLevels)) {
    await setDoc(doc(db, 'courses', dbmsCourseId, 'levels', levelId), levelData);
  }

  // Course 4: Principles of Aerodynamics
  const aeroCourseId = doc(collection(db, 'courses')).id;
  const aeroGraphData: ReactFlowData = {
    nodes: [
      {
        id: 'four-forces',
        type: 'default',
        position: { x: 250, y: 100 },
        data: { label: 'The Four Forces of Flight' },
      },
      {
        id: 'airfoils-lift',
        type: 'default',
        position: { x: 100, y: 250 },
        data: { label: 'Airfoils and Lift' },
      },
      {
        id: 'drag-thrust',
        type: 'default',
        position: { x: 400, y: 250 },
        data: { label: 'Drag and Thrust' },
      },
      {
        id: 'flight-stability',
        type: 'default',
        position: { x: 250, y: 400 },
        data: { label: 'Flight Stability' },
      },
    ],
    edges: [
      { id: 'e1', source: 'four-forces', target: 'airfoils-lift' },
      { id: 'e2', source: 'four-forces', target: 'drag-thrust' },
      { id: 'e3', source: 'airfoils-lift', target: 'flight-stability' },
      { id: 'e4', source: 'drag-thrust', target: 'flight-stability' },
    ],
  };

  await setDoc(doc(db, 'courses', aeroCourseId), {
    title: 'Principles of Aerodynamics',
    description:
      'Understand the science of flight through the four fundamental forces, aerodynamics principles, and aircraft stability concepts.',
    creatorId: 'system',
    type: 'platform_official',
    graphData: JSON.stringify(aeroGraphData),
    createdAt: serverTimestamp(),
  });

  const aeroLevels: Record<string, Omit<Level, 'id'>> = {
    'four-forces': {
      title: 'The Four Forces of Flight',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Flight',
          title: 'Forces of Flight',
        },
      ],
      mcqQuiz: [
        {
          question: 'What are the four forces acting on an aircraft in flight?',
          options: [
            'Lift, Weight, Thrust, Drag',
            'Up, Down, Forward, Backward',
            'Speed, Altitude, Direction, Stability',
            'Gravity, Air, Engine, Wing',
          ],
          correctIndex: 0,
        },
      ],
      aiQuizContext:
        'This level introduces the four fundamental forces of flight: lift (upward force), weight (downward force due to gravity), thrust (forward force from engines), and drag (backward force from air resistance). Explains how these forces must be balanced for flight, their relationships, and how pilots and engineers manipulate these forces to control aircraft. Covers the basic physics and practical applications of each force.',
    },
    'airfoils-lift': {
      title: 'Airfoils and Lift',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Airfoil',
          title: 'Airfoil and Lift Generation',
        },
      ],
      mcqQuiz: [
        {
          question: 'How does an airfoil generate lift?',
          options: [
            'By pushing air down',
            'By creating a pressure difference between upper and lower surfaces',
            'By heating the air',
            'By creating vacuum above the wing',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'Airfoils are specially shaped surfaces that generate lift through Bernoulli\'s principle and Newton\'s laws. This level explains how the curved shape of an airfoil causes air to move faster over the top surface, creating lower pressure above and higher pressure below, resulting in upward lift. Covers angle of attack, camber, chord line, and how different airfoil designs affect lift generation and efficiency.',
    },
    'drag-thrust': {
      title: 'Drag and Thrust',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Drag_(physics)',
          title: 'Drag in Aerodynamics',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is the main purpose of thrust in flight?',
          options: [
            'To generate lift',
            'To overcome drag and provide forward motion',
            'To stabilize the aircraft',
            'To control altitude',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'Drag is the resistance force acting opposite to the direction of motion, while thrust is the force that propels the aircraft forward. This level explains different types of drag (parasite drag, induced drag), how thrust is generated (propellers, jets, etc.), the relationship between thrust and drag, and how engineers design aircraft to minimize drag while maximizing thrust efficiency. Covers the importance of the thrust-to-weight ratio.',
    },
    'flight-stability': {
      title: 'Flight Stability',
      studyMaterials: [
        {
          type: 'article',
          url: 'https://en.wikipedia.org/wiki/Flight_dynamics',
          title: 'Flight Dynamics and Stability',
        },
      ],
      mcqQuiz: [
        {
          question: 'What is static stability in aircraft?',
          options: [
            'The ability to fly fast',
            'The tendency to return to equilibrium after a disturbance',
            'The ability to carry heavy loads',
            'The resistance to drag',
          ],
          correctIndex: 1,
        },
      ],
      aiQuizContext:
        'Flight stability refers to an aircraft\'s ability to maintain or return to a desired flight condition. This level covers static and dynamic stability, the three axes of flight (pitch, roll, yaw), how control surfaces (ailerons, elevators, rudder) affect stability, and the concepts of center of gravity and center of pressure. Explains the difference between stable and unstable aircraft designs and the trade-offs between stability and maneuverability.',
    },
  };

  for (const [levelId, levelData] of Object.entries(aeroLevels)) {
    await setDoc(doc(db, 'courses', aeroCourseId, 'levels', levelId), levelData);
  }

  console.log('Seed process completed successfully!');
  console.log('Created courses:', {
    ml: mlCourseId,
    qm: qmCourseId,
    dbms: dbmsCourseId,
    aero: aeroCourseId,
  });
};

export default seedCourses;

