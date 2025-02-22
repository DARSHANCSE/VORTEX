import { SimpleGit, simpleGit } from 'simple-git';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
    try {
        const { repoDir, paths, stageAll } = await req.json();
        if (!repoDir || !fs.existsSync(repoDir)) {
            return new Response(
                JSON.stringify({ error: "Valid repository directory is required" }), 
                { status: 400 }
            );
        }
        const git: SimpleGit = simpleGit(repoDir);
        if (stageAll) {
            await git.add('.');
            return new Response(
                JSON.stringify({ 
                    message: "All changes staged successfully" 
                }), 
                { status: 200 }
            );
        }
        if (!paths || !Array.isArray(paths)) {
            return new Response(
                JSON.stringify({ error: "Valid paths array is required when not staging all" }), 
                { status: 400 }
            );
        }
        for (const filePath of paths) {
            const fullPath = path.join(repoDir, filePath);
            if (!fs.existsSync(fullPath)) {
                return new Response(
                    JSON.stringify({ error: `Path not found: ${filePath}` }), 
                    { status: 400 }
                );
            }
            await git.add(filePath);
        }
        return new Response(
            JSON.stringify({ 
                message: "Specified paths staged successfully",
                stagedPaths: paths 
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