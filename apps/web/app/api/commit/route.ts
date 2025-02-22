import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const { repoDir, commitMessage, authorName, authorEmail } = await req.json();

        if (!repoDir || !fs.existsSync(repoDir) || !commitMessage) {
            return new Response(
                JSON.stringify({ 
                    error: "Repository directory and commit message are required" 
                }),
                { status: 400 }
            );
        }

        const git: SimpleGit = simpleGit(repoDir);

        const status = await git.status();
        if (status.staged.length === 0) {
            return new Response(
                JSON.stringify({ error: "No changes staged for commit" }), 
                { status: 400 }
            );
        }

        if (authorName && authorEmail) {
            await git.addConfig('user.name', authorName, false, 'local');
            await git.addConfig('user.email', authorEmail, false, 'local');
        }

        const commitResult = await git.commit(commitMessage);

        return new Response(
            JSON.stringify({ 
                message: "Changes committed successfully",
                commitHash: commitResult.commit,
                summary: commitResult.summary
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