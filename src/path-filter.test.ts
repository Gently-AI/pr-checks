import {describe, it, expect} from 'vitest';
import {matchesPathFilters} from './path-filter.js';

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
