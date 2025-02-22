import { SimpleGit, simpleGit } from 'simple-git';
import { Octokit } from '@octokit/rest';
import fs from 'fs';

export async function POST(req: Request) {
    try {
        const {
            repoDir,
            sourceBranch,
            targetBranch,
            title,
            body,
            githubToken
        } = await req.json();

        if (!repoDir || !fs.existsSync(repoDir) || !sourceBranch || !targetBranch || !title || !githubToken) {
            return new Response(
                JSON.stringify({ 
                    error: "Missing required parameters" 
                }), 
                { status: 400 }
            );
        }
        const git: SimpleGit = simpleGit(repoDir);
        const remotes = await git.remote(['get-url', 'origin']);
        if (!remotes) {
            return new Response(
                JSON.stringify({ error: "Could not get remote URL" }), 
                { status: 400 }
            );
        }
        const [owner, repo] = remotes
            .trim()
            .replace('https://github.com/', '')
            .replace('.git', '')
            .split('/');
        const octokit = new Octokit({ auth: githubToken });

        if(owner && repo) {
            const { data: pullRequest } = await octokit.pulls.create({
                owner,
                repo,
                title,
                body,
                head: sourceBranch,
                base: targetBranch
            });
            return new Response(
                JSON.stringify({ 
                    message: "Pull request created successfully",
                    pullRequestUrl: pullRequest.html_url,
                    pullRequestNumber: pullRequest.number
                }), 
                { status: 200 }
            );
        } else {
            return new Response(
                JSON.stringify({ error: "Could not get owner and repo" }),
                { status: 400 }
            );
        }
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }), 
            { status: 500 }
        );
    }
}