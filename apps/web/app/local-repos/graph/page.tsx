import React from 'react';
import { GitGraph } from '@/components/GitGraph';

const sampleData = {
  "nodes": [
    {
      "id": "a1b2c3d4e5f6",
      "author": "Alice",
      "message": "Initial commit",
      "timestamp": 1735560000000,
      "branches": []
    },
    {
      "id": "b2c3d4e5f6a1",
      "author": "Bob",
      "message": "Added README",
      "timestamp": 1735570000000,
      "branches": []
    },
    {
      "id": "c3d4e5f6a1b2",
      "author": "Charlie",
      "message": "Setup project structure",
      "timestamp": 1735580000000,
      "branches": ["main"]
    },
    {
      "id": "d4e5f6a1b2c3",
      "author": "Dave",
      "message": "Implemented feature A",
      "timestamp": 1735590000000,
      "branches": []
    },
    {
      "id": "e5f6a1b2c3d4",
      "author": "Eve",
      "message": "Bugfix in feature A",
      "timestamp": 1735600000000,
      "branches": ["dev"]
    },
    {
      "id": "f6a1b2c3d4e5",
      "author": "Frank",
      "message": "Started feature B",
      "timestamp": 1735610000000,
      "branches": []
    },
    {
      "id": "g7h8i9j0k1l2",
      "author": "Grace",
      "message": "Completed feature B",
      "timestamp": 1735620000000,
      "branches": ["feature-xyz"]
    },
    {
      "id": "h8i9j0k1l2m3",
      "author": "Hank",
      "message": "Merged feature B into dev",
      "timestamp": 1735630000000,
      "branches": ["dev"]
    },
    {
      "id": "i9j0k1l2m3n4",
      "author": "Ivy",
      "message": "Merged dev into main",
      "timestamp": 1735640000000,
      "branches": ["main"]
    }
  ],
  "links": [
    {
      "source": "b2c3d4e5f6a1",
      "target": "a1b2c3d4e5f6",
      "branches": ["main"]
    },
    {
      "source": "c3d4e5f6a1b2",
      "target": "b2c3d4e5f6a1",
      "branches": ["main"]
    },
    {
      "source": "d4e5f6a1b2c3",
      "target": "c3d4e5f6a1b2",
      "branches": ["dev"]
    },
    {
      "source": "e5f6a1b2c3d4",
      "target": "d4e5f6a1b2c3",
      "branches": ["dev"]
    },
    {
      "source": "f6a1b2c3d4e5",
      "target": "e5f6a1b2c3d4",
      "branches": ["feature-xyz"]
    },
    {
      "source": "g7h8i9j0k1l2",
      "target": "f6a1b2c3d4e5",
      "branches": ["feature-xyz"]
    },
    {
      "source": "h8i9j0k1l2m3",
      "target": "g7h8i9j0k1l2",
      "branches": ["dev"]
    },
    {
      "source": "i9j0k1l2m3n4",
      "target": "h8i9j0k1l2m3",
      "branches": ["main"]
    }
  ]
};

function App() {
  return (
    <div className="min-h-screen bg-[#1e1e1e] w-screen">
      <GitGraph data={sampleData} />
    </div>
  );
}

export default App;