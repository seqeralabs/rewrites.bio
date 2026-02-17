# RiiR.bio - Rewrite it in Rust, for bioinformatics

> Principles for responsible AI-assisted rewriting of bioinformatics tools.

A wave of AI-assisted rewrites is coming. The question is not whether it will happen, but whether it will happen well. These are the principles we follow.

---

## I. Philosophy

### 1.1 Credit the original authors

Always, everywhere. In the README, the docs, the paper, and any downstream reports. A dedicated credits page should list every reimplemented tool with its full citation.

### 1.2 Emulate exactly, then optimise

The first goal is bit-identical or numerically-identical output. This inherits the validation history of the original tool and lets users switch with zero risk to their scientific conclusions. Optimisations that change output should be opt-in.

### 1.3 Be transparent about AI

If AI coding assistants were used, say so. This is a strength, not a weakness. It demonstrates that correctness was verified through output comparison, not code review alone.

## II. Planning

### 2.1 Think big

Combine tools. Eliminate redundant I/O. Remove upstream prerequisites. Rethink how multiple tools share work.

### 2.2 Work small

Small iteration loops. One tool at a time. Step-by-step validation against the original output before moving on.

### 2.3 Engage upstream

Collaborate with the original developers rather than working in isolation. Co-authorship, contributions, or at minimum a conversation before public release.

## III. Building

### 3.1 Test relentlessly

Different data types, different sizes, different edge cases. Missing prerequisites should give clear error messages.

### 3.2 Use real test data

Don't rely on artificial inputs. Real sequencing data has quirks and edge cases that synthetic data never captures.

### 3.3 Replicate, don't improve

Always target 1:1 replication of results. If you find improvements, take them upstream first.

### 3.4 Pin versions and document

Pin the exact version of every original tool you emulate. Document the comparison methodology.

## IV. Stewardship

### 4.1 Maintain and govern

Contribution guidelines, code of conduct, release process. An unmaintained rewrite is worse than no rewrite.

### 4.2 Preserve compatibility

Output formats identical to originals. Downstream tools, pipelines, and reporting frameworks should work unmodified.

### 4.3 Respect upstream licenses

Your rewrite's license should be at least as permissive as the original.

### 4.4 Release as open source

The tools you're rewriting were built by the community for the community.

### 4.5 Don't file reckless bug reports

Full replication with the original tool. Full understanding by a human. No automated AI bug reports.

---

*The wave is coming. Let us make sure it lifts all boats.*

Website: https://riir.bio
Source: https://github.com/ewels/riir.bio
