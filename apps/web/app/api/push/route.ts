import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const { repoDir, branch = 'HEAD' } = await req.json();
        if (!repoDir || !fs.existsSync(repoDir)) {
            return new Response(
                JSON.stringify({ 
                    error: "Repository directory is required" 
                }), 
                { status: 400 }
            );
        }
        const git: SimpleGit = simpleGit(repoDir);
        const status = await git.status();
        if (status.ahead === 0) {
            return new Response(
                JSON.stringify({ error: "No commits to push" }), 
                { status: 400 }
            );
        }
        await git.push('origin', branch);
        return new Response(
            JSON.stringify({ 
                message: "Changes pushed successfully",
                branch: branch
            }), 
            { status: 200 }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500 }
        );
    }
}