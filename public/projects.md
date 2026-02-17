# RiiR.bio - Projects

Bioinformatics tools that have been rewritten in Rust. Each replaces an existing tool with a faster implementation, following the principles of this manifesto.

---

## Rust Rewrites

### RustQC
15 RNA-seq QC tools consolidated into a single Rust binary with a single BAM pass. >34x speedup, numerically identical output. Developed using Claude Code by an author with no prior Rust experience.
- **Replaces:** dupRadar, RSeQC (7 modules), preseq, featureCounts, Qualimap, samtools (3 commands)
- **GitHub:** https://github.com/ewels/RustQC

### fastqc-rs
A Rust reimplementation of FastQC, the ubiquitous sequencing quality control tool. Produces equivalent quality metrics with significantly faster execution.
- **Replaces:** FastQC (Java)
- **GitHub:** https://github.com/fastqc-rs/fastqc-rs

### Chopper
Long-read filtering and trimming. Consolidates two Python tools into a single fast Rust binary.
- **Replaces:** NanoFilt / NanoLyse (Python)
- **GitHub:** https://github.com/wdecoster/chopper
- **Paper:** https://doi.org/10.1093/bioinformatics/btad311

---

## Rust Libraries & Frameworks

### noodles
Pure-Rust library for bioinformatics file formats (BAM, CRAM, VCF, BCF, FASTA, FASTQ, GFF, BED). No C dependencies.
- **GitHub:** https://github.com/zaeleus/noodles

### Rust-Bio
Comprehensive bioinformatics library providing algorithms for pattern matching, alignment, suffix arrays, and more.
- **GitHub:** https://github.com/rust-bio/rust-bio
- **Paper:** https://doi.org/10.1093/bioinformatics/btv573

### Rust-HTSlib
Rust bindings to htslib for reading/writing BAM, SAM, CRAM, VCF, and BCF.
- **GitHub:** https://github.com/rust-bio/rust-htslib

### needletail
High-performance FASTA/FASTQ parser. Minimal, fast, and correct.
- **GitHub:** https://github.com/onecodex/needletail
- **Paper:** https://doi.org/10.21105/joss.02705

---

Know a project that belongs here? Open an issue: https://github.com/ewels/riir.bio/issues

Website: https://riir.bio
Source: https://github.com/ewels/riir.bio
