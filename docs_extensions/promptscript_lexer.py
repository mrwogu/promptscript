"""
Custom Pygments lexer for PromptScript (.prs) files.

This lexer provides syntax highlighting for PromptScript, matching the
highlighting style used in the PromptScript Playground.
"""

from pygments.lexer import RegexLexer, bygroups, include
from pygments.token import (
    Comment,
    Keyword,
    Name,
    Number,
    Punctuation,
    String,
    Text,
    Whitespace,
)

# Regex for environment variables: ${VAR} or ${VAR:-default}
ENV_VAR_PATTERN = r"\$\{[A-Z_][A-Z0-9_]*(?::-[^}]*)?\}"


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
            # Block declarations (e.g., @meta, @identity, @restrictions)
            (
                r"(@)(meta|identity|standards|shortcuts|agents|skills|local|extend|restrictions)\b",
                bygroups(Punctuation, Keyword.Declaration),
            ),
            # Inherit statement with path
            (
                r"(@inherit)(\s+)(@[\w\-./]+(?:@[\w\-.]+)?)",
                bygroups(Keyword.Namespace, Whitespace, String),
            ),
            # Use statement with path
            (
                r"(@use)(\s+)(@[\w\-./]+(?:@[\w\-.]+)?|\.[\w\-./]+)",
                bygroups(Keyword.Namespace, Whitespace, String),
            ),
            # Block content
            (r"\{", Punctuation, "block"),
            # Brackets
            (r"\[", Punctuation, "list"),
        ],
        "block": [
            # Comments inside blocks
            (r"#.*$", Comment.Single),
            # Whitespace
            (r"\s+", Whitespace),
            # Triple-quoted strings (multiline content)
            (r'"""', String.Doc, "docstring"),
            # List item marker (for restrictions)
            (r"-\s+", Punctuation),
            # Known property names (highlighted as attributes)
            (
                r"(id|name|syntax|description|version|author|license|homepage|repository|keywords|extends|type|content|convention|trigger|enabled|path|prompt|model|tools)\s*(:)",
                bygroups(Name.Attribute, Punctuation),
            ),
            # Any identifier followed by colon (category/key names)
            (
                r"([\w\-]+)\s*(:)",
                bygroups(Name.Label, Punctuation),
            ),
            # Nested blocks
            (r"\{", Punctuation, "#push"),
            (r"\}", Punctuation, "#pop"),
            # Lists
            (r"\[", Punctuation, "list"),
            # Strings with interpolation
            (r'"', String.Double, "string_double"),
            (r"'", String.Single, "string_single"),
            # Environment variables outside strings
            (ENV_VAR_PATTERN, Name.Variable),
            # Numbers
            (r"\d+\.\d+\.\d+", Number),  # Semver
            (r"\d+", Number),
            # Booleans
            (r"\b(true|false)\b", Keyword.Constant),
            # Other text
            (r"[^\s\{\}\[\]\"'#:]+", Text),
        ],
        "list": [
            # Comments
            (r"#.*$", Comment.Single),
            # Whitespace
            (r"\s+", Whitespace),
            # Comma separator
            (r",", Punctuation),
            # Strings in lists with interpolation
            (r'"', String.Double, "string_double"),
            (r"'", String.Single, "string_single"),
            # End of list
            (r"\]", Punctuation, "#pop"),
            # Other content
            (r"[^\]\s\"',#]+", Text),
        ],
        "string_double": [
            # Environment variables inside strings
            (ENV_VAR_PATTERN, Name.Variable),
            # End of string
            (r'"', String.Double, "#pop"),
            # String content (no env var start)
            (r'[^"$]+', String.Double),
            # Dollar sign not followed by brace
            (r"\$(?!\{)", String.Double),
        ],
        "string_single": [
            # Environment variables inside strings
            (ENV_VAR_PATTERN, Name.Variable),
            # End of string
            (r"'", String.Single, "#pop"),
            # String content (no env var start)
            (r"[^'$]+", String.Single),
            # Dollar sign not followed by brace
            (r"\$(?!\{)", String.Single),
        ],
        "docstring": [
            # Environment variables inside docstrings
            (ENV_VAR_PATTERN, Name.Variable),
            # End of docstring
            (r'"""', String.Doc, "#pop"),
            # Content (no env var start or quote)
            (r'[^"$]+', String.Doc),
            # Quote not part of closing
            (r'"(?!"")', String.Doc),
            # Dollar sign not followed by brace
            (r"\$(?!\{)", String.Doc),
        ],
    }


def setup(app):
    """Setup function for MkDocs/Sphinx integration."""
    pass
