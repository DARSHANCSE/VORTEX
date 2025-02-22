import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs';

interface LocalChanges {
    staged: Array<{ path: string; status: string }>;
    unstaged: Array<{ path: string; status: string }>;
}

export async function POST(req: Request) {
    try {
        const { repoDir } = await req.json();

        if (!repoDir || !fs.existsSync(repoDir)) {
            return new Response(
                JSON.stringify({ error: "Valid repository directory is required" }), 
                { status: 400 }
            );
        }

        const git: SimpleGit = simpleGit(repoDir);
        const status = await git.status();

        const changes: LocalChanges = {
            staged: status.staged.map(path => ({ 
                path, 
                status: 'staged' 
            })),
            unstaged: [
                ...status.modified.map(path => ({ 
                    path, 
                    status: 'modified' 
                })),
                ...status.not_added.map(path => ({ 
                    path, 
                    status: 'untracked' 
                })),
                ...status.deleted.map(path => ({ 
                    path, 
                    status: 'deleted' 
                }))
            ]
        };

        return new Response(
            JSON.stringify(changes), 
            { 
                status: 200,
                headers: { "Content-Type": "application/json" }
            }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500 }
        );
    }
} 