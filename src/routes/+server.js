import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export async function GET() {
    const staticDir = 'static';
    const files = fs.readdirSync(staticDir)
        .filter(file => file.endsWith('.pdf'))
        .map(file => ({
            name: file,
            url: `/${file}`
        }));
    
    return json(files);
}