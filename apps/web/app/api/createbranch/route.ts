import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const { 
            repoDir, 
            newBranchName, 
            sourceBranch,
            commitHash 
        } = await req.json();

        if (!repoDir || !fs.existsSync(repoDir) || !newBranchName || !sourceBranch || !commitHash) {
            return new Response(
                JSON.stringify({ 
                    error: "Repository directory, new branch name, source branch, and commit hash are required" 
                }), 
                { status: 400 }
            );
        }

        const git: SimpleGit = simpleGit(repoDir);

        const currentBranch = await git.revparse(['--abbrev-ref', 'HEAD']);

        try {
            await git.checkout([sourceBranch]);
            
            const commits = await git.log([sourceBranch]);
            if (!commits.all.find(commit => commit.hash === commitHash)) {
                throw new Error(`Commit ${commitHash} not found in branch ${sourceBranch}`);
            }
            await git.checkout([commitHash]);
            await git.checkoutLocalBranch(newBranchName);
            await git.checkout(currentBranch);
            return new Response(
                JSON.stringify({ 
                    message: "Branch created successfully",
                    newBranch: newBranchName,
                    sourceBranch,
                    commitHash
                }), 
                { status: 200 }
            );
        } catch (error: any) {
            await git.checkout(currentBranch);
            throw error;
        }
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500 }
        );
    }
}