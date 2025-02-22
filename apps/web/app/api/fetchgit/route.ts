import { simpleGit } from 'simple-git';
import { NextRequest, NextResponse } from 'next/server';
export  async function POST(req:NextRequest,) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const { repoPath } = await req.json();
    
    if (!repoPath) {
      return NextResponse.json({ error: 'Repository path is required' }, { status: 400 });
    }
    
    const graphData = await collectGitGraphData(repoPath);
    return NextResponse.json(graphData, { status: 200 });
  } catch (error) {
    console.error('Error processing git data:', error);
    return NextResponse.json({ error: 'Failed to process git repository data' }, { status: 500 });
  }
}

async function collectGitGraphData(repoPath) {
  try {
    const git = simpleGit(repoPath);
    
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      throw new Error('Not a valid git repository');
    }
    const logOptions = [
      '--all',
      '--date-order',
      '--reverse',
      '--parents',
      '--pretty=format:%H|%P|%an|%at|%s|%D'
    ];
    
    const rawLog = await git.raw(['log', ...logOptions]);
    
    const commits = rawLog.split('\n')
      .filter(line => line.trim() !== '')
      .map(line => {
        const [hash, parents, author, timestamp, message, refs] = line.split('|');
        return {
          id: hash,
          parents: parents ? parents.split(' ') : [],
          author,
          message,
          timestamp: parseInt(timestamp) * 1000,
          refs: refs ? refs.trim() : ''
        };
      });
    
    const branchData = await git.branch(['-v', '--all']);
   
    const branchCommits = {};
    Object.keys(branchData.branches).forEach(branchName => {
      const branchInfo = branchData.branches[branchName];
      const normalizedName = branchName.replace('remotes/', '');
      
    
      if (!branchCommits[normalizedName]) {
        branchCommits[normalizedName] = {
          name: normalizedName,
          head: branchInfo.commit,
          color: getColorForBranch(normalizedName)
        };
      }
    });
    
   
    const nodes = [];
    const links = [];
    const nodeMap = {};
    
    // Create nodes
    commits.forEach((commit, index) => {
      const node = {
        id: commit.id,
        author: commit.author,
        message: commit.message,
        timestamp: commit.timestamp,
        branches: []
      };
      
      Object.keys(branchCommits).forEach(branchName => {
        if (
          commit.refs.includes(branchName) || 
          commit.refs.includes(`refs/heads/${branchName}`) ||
          commit.refs.includes(`refs/remotes/${branchName}`) ||
          branchCommits[branchName].head === commit.id
        ) {
          node.branches.push(branchName);
        }
      });
      
      nodes.push(node);
      nodeMap[commit.id] = index;
    });
    
    commits.forEach(commit => {
      if (commit.parents && commit.parents.length > 0) {
        commit.parents.forEach(parent => {
          if (nodeMap[parent] !== undefined) {
            const branchesForLink = getBranchesForLink(commit.id, parent, commits, branchCommits);
            
            links.push({
              source: commit.id,
              target: parent,
              branches: branchesForLink
            });
          }
        });
      }
    });
    
    return {
      nodes,
      links,
      branches: branchCommits
    };
  } catch (err) {
    console.error('Error collecting git graph data:', err);
    throw err;
  }
}

function getColorForBranch(branchName) {
  const colorMap = {
    'master': '#007bff',
    'main': '#007bff',
    'develop': '#28a745',
    'feature': '#6610f2',
    'hotfix': '#dc3545',
    'release': '#fd7e14',
    'bugfix': '#ffc107'
  };

  for (const [prefix, color] of Object.entries(colorMap)) {
    if (branchName.includes(prefix)) {
      return color;
    }
  }
  

  return '#6c757d';
}


function getBranchesForLink(commitHash, parentHash, commits, branchCommits) {
  const result = [];
  
  
  const branchHeads = {};
  Object.keys(branchCommits).forEach(branchName => {
    branchHeads[branchCommits[branchName].head] = branchName;
  });
  
  
  const commit = commits.find(c => c.id === commitHash);
  if (commit && commit.parents.length > 1) {
   
    if (commit.message.toLowerCase().includes('merge')) {
     
      Object.keys(branchCommits).forEach(branchName => {
        if (commit.message.toLowerCase().includes(branchName.toLowerCase())) {
          result.push(branchName);
        }
      });
    }
  }
  

  if (branchHeads[commitHash]) {
    result.push(branchHeads[commitHash]);
  }
  
  
  if (result.length === 0) {
    if (commit?.message.startsWith('feat:')) result.push('feature');
    else if (commit?.message.startsWith('fix:')) result.push('hotfix');
    else if (commit?.message.startsWith('release:')) result.push('release');
    else if (commit?.message.startsWith('docs:')) result.push('docs');
    else if (commit?.message.startsWith('test:')) result.push('test');
    else result.push('master'); // Default
  }
  
  return result;
}