'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { FolderGit, Eye, GitBranch, SortAsc, ChevronDown, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface LocalRepo {
  id: string;
  name: string;
  path: string;
  addedAt: Date;
}

type SortOption = 'recent' | 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc';

export default function LocalReposPage() {
  const [localRepos, setLocalRepos] = useState<LocalRepo[]>([]);
  const [pathInput, setPathInput] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [isLoading, setIsLoading] = useState(false);
  const router=useRouter();

  useEffect(() => {
    fetchRepositories();
  }, []);

  const handleViewRepository = (path: string) => {
    console.log(path);
    router.push(`/local-repos/graph?path=${path}`);

  };

  const fetchRepositories = async () => {
    try {
      const { data } = await axios.get('/api/localrepos');
      setLocalRepos(data);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to fetch repositories');
    }
  };

  const normalizeWslPath = (path: string): string => {
    if (path.startsWith('/mnt/')) {
      const driveLetter = path.charAt(5).toUpperCase();
      const remainingPath = path.slice(6).replace(/\//g, '\\');
      return `${driveLetter}:${remainingPath}`;
    }
    return path;
  };

  const getDirectoryNameFromPath = (fullPath: string): string => {
    const cleanPath = fullPath.replace(/[/\\]$/, '');
    return cleanPath.split(/[/\\]/).pop() || '';
  };

  const handleAddRepository = async () => {
    if (!pathInput.trim()) return;

    setIsLoading(true);
    try {
      const normalizedPath = normalizeWslPath(pathInput.trim());
      const dirName = getDirectoryNameFromPath(normalizedPath);

      const newRepo = {
        id: Date.now().toString(),
        name: dirName,
        path: normalizedPath,
        addedAt: new Date()
      };
      console.log(newRepo);
      console.log("hello");

      const res=await axios.post('/api/localrepos', newRepo);
      console.log(res);
      await fetchRepositories();
      setPathInput('');
      toast.success('Repository added successfully');
    } catch (error: any) {
      console.error('Error adding repository:', error);
      toast.error(error.response?.data?.error || 'Failed to add repository');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRepository = async (path: string) => {
    try {
      await axios.delete('/api/localrepos', {
        data: { path }
      });
      
      await fetchRepositories();
      toast.success('Repository deleted successfully');
    } catch (error) {
      console.error('Error deleting repository:', error);
      toast.error('Failed to delete repository');
    }
  };

  const getSortedRepos = (repos: LocalRepo[]): LocalRepo[] => {
    const sortedRepos = [...repos];
    
    switch (sortBy) {
      case 'recent':
        return sortedRepos;
      case 'name-asc':
        return sortedRepos.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sortedRepos.sort((a, b) => b.name.localeCompare(a.name));
      case 'date-asc':
        return sortedRepos.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
      case 'date-desc':
        return sortedRepos.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
      default:
        return sortedRepos;
    }
  };

  return (
    <div className="p-6 bg-[#1e1e1e] min-h-screen w-screen">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-white">Local Repositories</h1>
            <p className="text-zinc-400">Manage your local git repositories</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Input
            value={pathInput}
            onChange={(e) => setPathInput(e.target.value)}
            placeholder="Enter repository path (e.g., /path/to/repo or C:\path\to\repo)"
            className="bg-zinc-900 border-zinc-800 text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddRepository();
              }
            }}
          />
          <Button
            onClick={handleAddRepository}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-black"
          >
            <FolderGit className="w-4 h-4" />
            Add Repository
          </Button>
        </div>

        {localRepos.length > 0 && (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                  <SortAsc className="w-4 h-4" />
                  {/* {getSortLabel(sortBy)} */}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-700">
                <DropdownMenuItem 
                  onClick={() => setSortBy('name-asc')}
                  className="text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
                >
                  Name (A-Z)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('name-desc')}
                  className="text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
                >
                  Name (Z-A)
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('date-asc')}
                  className="text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
                >
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('date-desc')}
                  className="text-zinc-300 hover:bg-zinc-800 focus:bg-zinc-800"
                >
                  Newest First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

<div className="grid gap-4">
        {getSortedRepos(localRepos).map((repo) => (
          console.log(repo),
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4 bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900/80 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <GitBranch className="w-5 h-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{repo.name}</h3>
                    <p className="text-sm text-zinc-400">{repo.path}</p>
                    <p className="text-xs text-zinc-500">
                      Added {new Date(repo.addedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-2 border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                    onClick={() => handleViewRepository(repo.path)}
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 border-zinc-700 hover:bg-red-900/50 text-zinc-300"
                    onClick={() => handleDeleteRepository(repo.path)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

        {localRepos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30"
          >
            <GitBranch className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">
              No local repositories added yet. Enter a repository path to get started.
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}