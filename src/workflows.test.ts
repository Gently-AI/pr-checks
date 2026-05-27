import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {getWorkflowJobs} from './workflows.js';

describe('getWorkflowJobs', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-checks-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, {recursive: true, force: true});
    });

    it('parses job keys from a workflow file', () => {
        fs.writeFileSync(path.join(tmpDir, 'ci.yml'), `
name: CI
on:
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps: []
  lint:
    runs-on: ubuntu-latest
    steps: []
`);
        const result = getWorkflowJobs(tmpDir);
        expect(result['ci.yml'].jobs).toEqual(['test', 'lint']);
    });

    it('uses job name field when present', () => {
        fs.writeFileSync(path.join(tmpDir, 'ci.yml'), `
name: CI
on:
  pull_request:
jobs:
  build:
    name: Build and Test
    runs-on: ubuntu-latest
    steps: []
`);
        const result = getWorkflowJobs(tmpDir);
        expect(result['ci.yml'].jobs).toEqual(['Build and Test']);
    });

    it('falls back to job key when name is absent', () => {
        fs.writeFileSync(path.join(tmpDir, 'ci.yml'), `
name: CI
on:
  pull_request:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps: []
`);
        const result = getWorkflowJobs(tmpDir);
        expect(result['ci.yml'].jobs).toEqual(['deploy']);
    });

    it('reads path filters from workflow config', () => {
        fs.writeFileSync(path.join(tmpDir, 'frontend.yml'), `
name: Frontend
on:
  pull_request:
    paths:
      - 'src/frontend/**'
      - '!src/frontend/generated/**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps: []
`);
        const result = getWorkflowJobs(tmpDir);
        expect(result['frontend.yml'].config.on?.pull_request?.paths).toEqual([
            'src/frontend/**',
            '!src/frontend/generated/**'
        ]);
    });

    it('handles .yaml extension', () => {
        fs.writeFileSync(path.join(tmpDir, 'build.yaml'), `
name: Build
on: push
jobs:
  compile:
    runs-on: ubuntu-latest
    steps: []
`);
        const result = getWorkflowJobs(tmpDir);
        expect(result['build.yaml']).toBeDefined();
        expect(result['build.yaml'].jobs).toEqual(['compile']);
    });

    it('ignores non-yaml files', () => {
        fs.writeFileSync(path.join(tmpDir, 'readme.md'), '# Workflows');
        fs.writeFileSync(path.join(tmpDir, 'ci.yml'), `
name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps: []
`);
        const result = getWorkflowJobs(tmpDir);
        expect(Object.keys(result)).toEqual(['ci.yml']);
    });

    it('returns empty object for nonexistent directory', () => {
        const result = getWorkflowJobs('/nonexistent/path');
        expect(result).toEqual({});
    });

    it('reads paths-ignore from workflow config', () => {
        fs.writeFileSync(path.join(tmpDir, 'ci.yml'), `
name: CI
on:
  pull_request:
    paths-ignore:
      - 'docs/**'
      - '*.md'
jobs:
  test:
    runs-on: ubuntu-latest
    steps: []
`);
        const result = getWorkflowJobs(tmpDir);
        expect(result['ci.yml'].config.on?.pull_request?.['paths-ignore']).toEqual([
            'docs/**',
            '*.md'
        ]);
    });

    it('handles multiple workflows', () => {
        fs.writeFileSync(path.join(tmpDir, 'ci.yml'), `
name: CI
on: push
jobs:
  test:
    runs-on: ubuntu-latest
    steps: []
`);
        fs.writeFileSync(path.join(tmpDir, 'deploy.yml'), `
name: Deploy
on: push
jobs:
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    steps: []
`);
        const result = getWorkflowJobs(tmpDir);
        expect(Object.keys(result).sort()).toEqual(['ci.yml', 'deploy.yml']);
        expect(result['ci.yml'].jobs).toEqual(['test']);
        expect(result['deploy.yml'].jobs).toEqual(['Deploy to Staging']);
    });
});
