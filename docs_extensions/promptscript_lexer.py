"""
Custom Pygments lexer for PromptScript (.prs) files.

This lexer provides syntax highlighting for PromptScript, matching the
highlighting style used in the PromptScript Playground.
"""

from pygments.lexer import RegexLexer, bygroups, include, using
from pygments.token import (
    Comment,
    Keyword,
    Name,
    Number,
    Operator,
    Punctuation,
    String,
    Text,
    Whitespace,
)


class PromptScriptLexer(RegexLexer):
    """
    Lexer for PromptScript (.prs) files.

    PromptScript is a language for defining AI instructions and policies
    that compile to various AI tool formats (Claude Code, GitHub Copilot, etc.).
    """

    name = "PromptScript"
    aliases = ["promptscript", "prs"]
    filenames = ["*.prs"]
    mimetypes = ["text/x-promptscript"]

    tokens = {
        "root": [
            # Comments
            (r"#.*$", Comment.Single),
            # Whitespace
            (r"\s+", Whitespace),
            # Block declarations (e.g., @meta, @identity)
            (
                r"(@)(meta|identity|standards|shortcuts|agents|skills|local|extend)\b",
                bygroups(Punctuation, Keyword.Declaration),
            ),
            # Inherit and use statements
            (
                r"\b(inherit)\s+",
                bygroups(Keyword.Namespace),
                "inherit_path",
            ),
            (
                r"\b(use)\s+",
                bygroups(Keyword.Namespace),
                "use_path",
            ),
            # Block content
            (r"\{", Punctuation, "block"),
            # Brackets
            (r"\[", Punctuation, "list"),
        ],
        "inherit_path": [
            # Path with optional version (e.g., "@company/base@1.0.0")
            (
                r'(["\']?)(@?[\w\-./]+(?:@[\w\-./]+)?)\1',
                bygroups(String.Delimiter, String),
                "#pop",
            ),
            (r"\s+", Whitespace),
            (r"", Text, "#pop"),
        ],
        "use_path": [
            # Path with optional version
            (
                r'(["\']?)(@?[\w\-./]+(?:@[\w\-./]+)?)\1',
                bygroups(String.Delimiter, String),
                "#pop",
            ),
            (r"\s+", Whitespace),
            (r"", Text, "#pop"),
        ],
        "block": [
            # Comments inside blocks
            (r"#.*$", Comment.Single),
            # Whitespace
            (r"\s+", Whitespace),
            # Triple-quoted strings (multiline content)
            (r'"""', String.Doc, "docstring"),
            # Property names in meta blocks
            (
                r"(id|name|syntax|description|version|author|license|homepage|repository|keywords|extends|type|content|convention|trigger|enabled|path)\s*(:)",
                bygroups(Name.Attribute, Punctuation),
            ),
            # Category names in standards (code, docs, testing, etc.)
            (
                r"(code|docs|testing|security|performance|accessibility|naming|formatting|architecture|dependencies|versioning|ci|deployment)\s*(:)",
                bygroups(Name.Label, Punctuation),
            ),
            # Nested blocks
            (r"\{", Punctuation, "#push"),
            (r"\}", Punctuation, "#pop"),
            # Lists
            (r"\[", Punctuation, "list"),
            # Strings
            (r'"[^"]*"', String.Double),
            (r"'[^']*'", String.Single),
            # Numbers
            (r"\d+\.\d+\.\d+", Number),  # Semver
            (r"\d+", Number),
            # Booleans
            (r"\b(true|false)\b", Keyword.Constant),
            # Other text
            (r"[^\s\{\}\[\]\"'#]+", Text),
        ],
        "list": [
            # Comments
            (r"#.*$", Comment.Single),
            # Whitespace
            (r"\s+", Whitespace),
            # Strings in lists (rules, etc.)
            (r'"[^"]*"', String.Double),
            (r"'[^']*'", String.Single),
            # End of list
            (r"\]", Punctuation, "#pop"),
            # Other content
            (r"[^\]\s\"'#]+", Text),
        ],
        "docstring": [
            # End of docstring
            (r'"""', String.Doc, "#pop"),
            # Content
            (r'[^"]+', String.Doc),
            (r'"(?!"")', String.Doc),
        ],
    }


def setup(app):
    """Setup function for MkDocs/Sphinx integration."""
    pass
