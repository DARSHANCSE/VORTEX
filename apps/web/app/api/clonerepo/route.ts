import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { repoUrl, cloneDir } = await req.json();
        if (!repoUrl || !cloneDir) {
            return new Response(
                JSON.stringify({
                    error: "Repository URL and clone directory are required" 
                }), {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json"
                    }
                }
            );
        }
        if (!fs.existsSync(cloneDir)) {
            fs.mkdirSync(cloneDir, { recursive: true });
        }
        const repoName = repoUrl.split("/").pop()?.replace(".git", "") || "unknown_repo";
        const repoDir = path.join(cloneDir, repoName);

        const git: SimpleGit = simpleGit();
        await git.clone(repoUrl, repoDir);

        return new Response(
            JSON.stringify({ 
                success: true,
                repoDir: repoDir
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