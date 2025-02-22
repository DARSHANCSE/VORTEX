import { NextResponse } from 'next/server';
import redis from '@/lib/redis';

const REDIS_KEY = 'local:repositories';

export async function GET() {
  try {
    console.log("get request received");
    const repos = await redis.get(REDIS_KEY);
    return NextResponse.json(repos ? JSON.parse(repos) : []);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    console.log("post request received");
    const repo = await req.json();
    const existingReposJson = await redis.get(REDIS_KEY);
    const existingRepos = existingReposJson ? JSON.parse(existingReposJson) : [];
    
    const exists = existingRepos.some((r: any) => r.path === repo.path);
    if (exists) {
      return NextResponse.json(
        { error: 'Repository already exists' },
        { status: 400 }
      );
    }


    const updatedRepos = [repo, ...existingRepos];
    await redis.set(REDIS_KEY, JSON.stringify(updatedRepos));

    return NextResponse.json(repo, { status: 201 });
  } catch (error) {
    console.error('Error adding repository:', error);
    return NextResponse.json(
      { error: 'Failed to add repository' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { path } = await req.json();
    
    const existingReposJson = await redis.get(REDIS_KEY);
    const existingRepos = existingReposJson ? JSON.parse(existingReposJson) : [];
    
    const updatedRepos = existingRepos.filter((repo: any) => repo.path !== path);
    await redis.set(REDIS_KEY, JSON.stringify(updatedRepos));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting repository:', error);
    return NextResponse.json(
      { error: 'Failed to delete repository' },
      { status: 500 }
    );
  }
}