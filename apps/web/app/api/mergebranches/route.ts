import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs';

interface MergeConflict {
    file: string;
    content: string;
}

export async function POST(req: Request) {
    try {
        const { repoDir, sourceBranch, targetBranch } = await req.json();

        if (!repoDir || !fs.existsSync(repoDir) || !sourceBranch || !targetBranch) {
            return new Response(
                JSON.stringify({ 
                    error: "Repository directory and both branch names are required" 
                }), 
                { status: 400 }
            );
        }
        const git: SimpleGit = simpleGit(repoDir);
        const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);

        try {
           await git.checkout(targetBranch);
           await git.merge([sourceBranch]);
           return new Response(
                JSON.stringify({ 
                    message: "Branches merged successfully",
                    sourceBranch,
                    targetBranch
                }), 
                { status: 200 }
            );
        } catch (mergeError: any) {
            const status = await git.status();
            const conflicts: MergeConflict[] = [];
            for (const file of status.conflicted) {
                const content = await fs.promises.readFile(
                    `${repoDir}/${file}`, 
                    'utf8'
                );
                conflicts.push({ file, content });
            }
            await git.merge(['--abort']);
            await git.checkout(currentBranch);
            return new Response(
                JSON.stringify({ 
                    error: "Merge conflicts detected",
                    conflicts 
                }), 
                { status: 409 }
            );
        }
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500 }
        );
    }
}