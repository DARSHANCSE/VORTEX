import { Octokit } from '@octokit/rest';

export async function POST(req: Request) {
    try {
        const { 
            sourceOwner,
            sourceRepo,
            sourceBranch,
            targetOwner,
            targetRepo,
            targetBranch,
            title,
            body,
            githubToken 
        } = await req.json();

        if (!sourceOwner || !sourceRepo || !sourceBranch || 
            !targetOwner || !targetRepo || !targetBranch || 
            !title || !githubToken) {
            return new Response(
                JSON.stringify({ 
                    error: "Missing required parameters" 
                }), 
                { status: 400 }
            );
        }
        const octokit = new Octokit({ auth: githubToken });
        const { data: branches } = await octokit.repos.listBranches({
            owner: targetOwner,
            repo: targetRepo
        });
        if (!branches.find(b => b.name === targetBranch)) {
            return new Response(
                JSON.stringify({ 
                    error: "Target branch not found" 
                }), 
                { status: 404 }
            );
        }
        
        const { data: pullRequest } = await octokit.pulls.create({
            owner: targetOwner,
            repo: targetRepo,
            title,
            body,
            head: `${sourceOwner}:${sourceBranch}`,
            base: targetBranch
        });

        return new Response(
            JSON.stringify({ 
                message: "Cross-repository pull request created successfully",
                pullRequestUrl: pullRequest.html_url,
                pullRequestNumber: pullRequest.number,
                availableBranches: branches.map(b => b.name)
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