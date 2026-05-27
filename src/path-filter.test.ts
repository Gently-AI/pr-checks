import {describe, it, expect} from 'vitest';
import {matchesPathFilters, shouldSkipWorkflow} from './path-filter.js';

describe('matchesPathFilters', () => {
    describe('basic glob matching', () => {
        it('returns true when a file matches a simple glob', () => {
            expect(matchesPathFilters(['src/app.ts'], ['src/**'])).toBe(true);
        });

        it('returns false when no files match', () => {
            expect(matchesPathFilters(['docs/readme.md'], ['src/**'])).toBe(false);
        });

        it('returns true when any file matches among multiple changed files', () => {
            expect(matchesPathFilters(
                ['docs/readme.md', 'src/index.ts'],
                ['src/**']
            )).toBe(true);
        });

        it('matches multiple patterns', () => {
            expect(matchesPathFilters(['lib/util.ts'], ['src/**', 'lib/**'])).toBe(true);
        });

        it('returns false for empty changed paths', () => {
            expect(matchesPathFilters([], ['src/**'])).toBe(false);
        });

        it('returns false for empty filters', () => {
            expect(matchesPathFilters(['src/app.ts'], [])).toBe(false);
        });
    });

    describe('exact file matching', () => {
        it('matches an exact filename', () => {
            expect(matchesPathFilters(['package.json'], ['package.json'])).toBe(true);
        });

        it('does not match a different file', () => {
            expect(matchesPathFilters(['tsconfig.json'], ['package.json'])).toBe(false);
        });
    });

    describe('negation patterns in paths filter', () => {
        it('excludes files matching a negation pattern', () => {
            expect(matchesPathFilters(
                ['src/generated/types.ts'],
                ['src/**', '!src/generated/**']
            )).toBe(false);
        });

        it('includes files that match positive but not negation', () => {
            expect(matchesPathFilters(
                ['src/app.ts'],
                ['src/**', '!src/generated/**']
            )).toBe(true);
        });

        it('returns false when all patterns are negations', () => {
            expect(matchesPathFilters(
                ['src/app.ts'],
                ['!docs/**']
            )).toBe(false);
        });
    });

    describe('nested and complex globs', () => {
        it('matches deeply nested paths', () => {
            expect(matchesPathFilters(
                ['packages/frontend/src/components/Button.tsx'],
                ['packages/frontend/**']
            )).toBe(true);
        });

        it('matches file extension patterns', () => {
            expect(matchesPathFilters(
                ['src/index.ts'],
                ['**/*.ts']
            )).toBe(true);
        });

        it('does not match wrong extensions', () => {
            expect(matchesPathFilters(
                ['src/styles.css'],
                ['**/*.ts']
            )).toBe(false);
        });
    });
});

describe('shouldSkipWorkflow', () => {
    describe('no filters', () => {
        it('does not skip when no paths or paths-ignore are set', () => {
            expect(shouldSkipWorkflow(['src/app.ts'])).toBe(false);
        });

        it('does not skip when both arrays are empty', () => {
            expect(shouldSkipWorkflow(['src/app.ts'], [], [])).toBe(false);
        });
    });

    describe('paths filter (existing behavior)', () => {
        it('does not skip when changed files match paths filter', () => {
            expect(shouldSkipWorkflow(
                ['src/app.ts'],
                ['src/**']
            )).toBe(false);
        });

        it('skips when no changed files match paths filter', () => {
            expect(shouldSkipWorkflow(
                ['docs/readme.md'],
                ['src/**']
            )).toBe(true);
        });

        it('does not skip when any file matches among multiple', () => {
            expect(shouldSkipWorkflow(
                ['docs/readme.md', 'src/index.ts'],
                ['src/**']
            )).toBe(false);
        });

        it('handles negation patterns in paths', () => {
            expect(shouldSkipWorkflow(
                ['src/generated/types.ts'],
                ['src/**', '!src/generated/**']
            )).toBe(true);
        });
    });

    describe('paths-ignore filter', () => {
        it('skips when all changed files match paths-ignore patterns', () => {
            expect(shouldSkipWorkflow(
                ['docs/readme.md', 'docs/guide.md'],
                undefined,
                ['docs/**']
            )).toBe(true);
        });

        it('does not skip when some files are outside paths-ignore', () => {
            expect(shouldSkipWorkflow(
                ['docs/readme.md', 'src/app.ts'],
                undefined,
                ['docs/**']
            )).toBe(false);
        });

        it('does not skip when no files match paths-ignore', () => {
            expect(shouldSkipWorkflow(
                ['src/app.ts', 'lib/util.ts'],
                undefined,
                ['docs/**']
            )).toBe(false);
        });

        it('handles multiple paths-ignore patterns', () => {
            expect(shouldSkipWorkflow(
                ['docs/readme.md', 'README.md'],
                undefined,
                ['docs/**', '*.md']
            )).toBe(true);
        });

        it('does not skip when one file escapes multiple ignore patterns', () => {
            expect(shouldSkipWorkflow(
                ['docs/readme.md', 'src/app.ts'],
                undefined,
                ['docs/**', '*.md']
            )).toBe(false);
        });

        it('handles exact file in paths-ignore', () => {
            expect(shouldSkipWorkflow(
                ['LICENSE'],
                undefined,
                ['LICENSE']
            )).toBe(true);
        });

        it('does not skip for empty changed paths with paths-ignore', () => {
            expect(shouldSkipWorkflow(
                [],
                undefined,
                ['docs/**']
            )).toBe(false);
        });

        it('handles deeply nested paths-ignore', () => {
            expect(shouldSkipWorkflow(
                ['packages/docs/api/v1/reference.md'],
                undefined,
                ['packages/docs/**']
            )).toBe(true);
        });
    });
});
