import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs';

interface FileChange {
    filename: string;
    changes: string;
}

export async function POST(req: Request) {   // Pass the commitHash and the repoDir data da.
    try {
        const { commitHash, repoDir } = await req.json();
        
        if (!commitHash || !repoDir) {
            return new Response(
                JSON.stringify({ 
                    error: "Commit hash and repository directory are required" 
                }), {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        if (!fs.existsSync(repoDir)) {
            return new Response(
                JSON.stringify({ 
                    error: "Repository directory not found" 
                }), {
                    status: 404,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }

        return await getCommitDetails(commitHash, repoDir);
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}

async function getCommitDetails(commitHash: string, repoDir: string) {
    try {
        const git: SimpleGit = simpleGit(repoDir);
        const diffResult = await git.raw([
            'diff-tree',
            '--no-commit-id',
            '--name-only',
            '-r',
            commitHash
        ]);
        const changedFiles = diffResult.split('\n').filter(file => file.trim() !== '');
        const fileChanges: FileChange[] = [];
        for (const file of changedFiles) {
            const showResult = await git.raw([
                'show',
                commitHash,
                '--',
                file
            ]);

            fileChanges.push({
                filename: file,
                changes: showResult
            });
        }
        const commitInfo = await git.show(['-s', '--format=%B%n%an%n%ae', commitHash]);
        const [message, author, email] = commitInfo.split('\n');
        return new Response(
            JSON.stringify({ 
                commitHash,
                message: message?.trim(),
                author: author?.trim(),
                email: email?.trim(),
                fileChanges
            }), {
                status: 200,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }), {
                status: 500,
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }
}