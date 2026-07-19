"""
Custom Pygments lexer for PromptScript (.prs) files.

This lexer provides syntax highlighting for PromptScript, matching the
highlighting style used in the PromptScript Playground.
"""

from pygments.lexer import RegexLexer, bygroups
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

BLOCK_DIRECTIVES = (
    "identity",
    "context",
    "standards",
    "restrictions",
    "knowledge",
    "shortcuts",
    "commands",
    "guards",
    "params",
    "skills",
    "local",
    "agents",
    "workflows",
    "hooks",
    "mcpServers",
    "plugins",
    "prompts",
    "examples",
)

ENV_VAR_PATTERN = r"\$\{[A-Za-z_][A-Za-z0-9_]*(?::-[^}]*)?\}"
TEMPLATE_VAR_PATTERN = r"(\{\{)([A-Za-z_][A-Za-z0-9_]*)(\}\})"
IMPORT_PATH_PATTERN = (
    r"@[A-Za-z_][A-Za-z0-9_-]*/[A-Za-z0-9_/.-]*(?:@[A-Za-z0-9^~./-]+)?"
    r"|(?:\./|\.\./)[A-Za-z0-9_/.-]+"
    r"|[A-Za-z][A-Za-z0-9-]*\.[A-Za-z]{2,}/[A-Za-z0-9_./-]+"
    r"(?:@[A-Za-z0-9^~./-]+)?"
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
            # Inherit statement with path (registry @path, relative ./path, or URL host/path)
            (
                r"(@inherit)(\s+)(" + IMPORT_PATH_PATTERN + r")",
                bygroups(Keyword.Namespace, Whitespace, String),
            ),
            # Use statement with path (registry @path, relative ./path, or URL host/path)
            (
                r"(@use)(\s+)(" + IMPORT_PATH_PATTERN + r")",
                bygroups(Keyword.Namespace, Whitespace, String),
            ),
            # Extend statement with a dotted target
            (
                r"(@extend)(\s+)([A-Za-z_][\w-]*(?:\.[A-Za-z_][\w-]*)*)",
                bygroups(Keyword.Namespace, Whitespace, String),
            ),
            # Meta directive
            (
                r"(@)(meta)(?=[^\w-]|$)",
                bygroups(Punctuation, Keyword.Namespace),
            ),
            # Known block declarations
            (
                r"(@)(" + "|".join(BLOCK_DIRECTIVES) + r")(?=[^\w-]|$)",
                bygroups(Punctuation, Keyword.Declaration),
            ),
            # Custom block declarations
            (
                r"(@)([A-Za-z_][\w-]*)(?=\s*\{)",
                bygroups(Punctuation, Name.Tag),
            ),
            # Template expressions
            (TEMPLATE_VAR_PATTERN, bygroups(Punctuation, Name.Variable, Punctuation)),
            # Environment variables outside strings
            (ENV_VAR_PATTERN, Name.Variable),
            # Strings
            (r'"""', String.Doc, "docstring"),
            (r'"', String.Double, "string_double"),
            (r"'", String.Single, "string_single"),
            # Block content
            (r"\{", Punctuation, "block"),
            # Brackets
            (r"\[", Punctuation, "list"),
            # Scalars and punctuation used by import parameters
            (r"(?<![\w-])(true|false|null)(?![\w-])", Keyword.Constant),
            (r"-?\d+(?:\.\d+)?", Number),
            (r"(?<![\w-])(as|into)(?![\w-])", Keyword.Namespace),
            (r"\.\.", Operator),
            (r"[}\](),:=?!.]", Punctuation),
            (r"[A-Za-z_][\w-]*", Text),
        ],
        "block": [
            # Comments inside blocks
            (r"#.*$", Comment.Single),
            # Whitespace
            (r"\s+", Whitespace),
            # Triple-quoted strings (multiline content)
            (r'"""', String.Doc, "docstring"),
            # List item marker (for restrictions)
            (r"(-)(\s+)", bygroups(Punctuation, Whitespace)),
            # Known property names (highlighted as attributes)
            (
                r"(id|name|syntax|description|version|author|license|homepage|repository|keywords|extends|type|content|convention|trigger|enabled|path|prompt|model|tools)([?!])?(\s*)(:)",
                bygroups(Name.Attribute, Operator, Whitespace, Punctuation),
            ),
            # Any identifier followed by colon (category/key names)
            (
                r"([\w\-]+)([?!])?(\s*)(:)",
                bygroups(Name.Label, Operator, Whitespace, Punctuation),
            ),
            # Inline @use statement within blocks (e.g., inside @skills)
            (
                r"(@use)(\s+)(" + IMPORT_PATH_PATTERN + r")",
                bygroups(Keyword.Namespace, Whitespace, String),
            ),
            # 'as' keyword for inline @use aliases
            (r"(?<![\w-])(as)(?![\w-])", Keyword.Namespace),
            # 'into' keyword for inline @use output directories
            (r"(?<![\w-])(into)(?![\w-])", Keyword.Namespace),
            # Template expressions
            (TEMPLATE_VAR_PATTERN, bygroups(Punctuation, Name.Variable, Punctuation)),
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
            (r"-?\d+(?:\.\d+)?", Number),
            # Constants and type keywords
            (r"(?<![\w-])(true|false|null)(?![\w-])", Keyword.Constant),
            (
                r"(?<![\w-])(string|number|boolean|range|enum)(?![\w-])",
                Keyword.Type,
            ),
            # Operators and punctuation
            (r"\.\.", Operator),
            (r"[(),:=?!.]", Punctuation),
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
            # Nested values
            (r"\{", Punctuation, "block"),
            (r"\[", Punctuation, "#push"),
            (r'"""', String.Doc, "docstring"),
            (TEMPLATE_VAR_PATTERN, bygroups(Punctuation, Name.Variable, Punctuation)),
            (ENV_VAR_PATTERN, Name.Variable),
            # Strings in lists with interpolation
            (r'"', String.Double, "string_double"),
            (r"'", String.Single, "string_single"),
            # Scalars and punctuation
            (r"\d+\.\d+\.\d+", Number),
            (r"-?\d+(?:\.\d+)?", Number),
            (r"(?<![\w-])(true|false|null)(?![\w-])", Keyword.Constant),
            (
                r"(?<![\w-])(string|number|boolean|range|enum)(?![\w-])",
                Keyword.Type,
            ),
            (r"\.\.", Operator),
            (r"[()=:?!.]", Punctuation),
            # End of list
            (r"\]", Punctuation, "#pop"),
            # Other content
            (r"[^\[\]\{\}\s\"',#:]+", Text),
        ],
        "string_double": [
            # Template expressions
            (TEMPLATE_VAR_PATTERN, bygroups(Punctuation, Name.Variable, Punctuation)),
            # Environment variables inside strings
            (ENV_VAR_PATTERN, Name.Variable),
            # Escape sequences
            (r"\\.", String.Escape),
            # End of string
            (r'"', String.Double, "#pop"),
            # String content
            (r'[^"\\${]+', String.Double),
            (r"[$\{]", String.Double),
        ],
        "string_single": [
            # Template expressions
            (TEMPLATE_VAR_PATTERN, bygroups(Punctuation, Name.Variable, Punctuation)),
            # Environment variables inside strings
            (ENV_VAR_PATTERN, Name.Variable),
            # Escape sequences
            (r"\\.", String.Escape),
            # End of string
            (r"'", String.Single, "#pop"),
            # String content
            (r"[^'\\${]+", String.Single),
            (r"[$\{]", String.Single),
        ],
        "docstring": [
            # Template expressions
            (TEMPLATE_VAR_PATTERN, bygroups(Punctuation, Name.Variable, Punctuation)),
            # Environment variables inside docstrings
            (ENV_VAR_PATTERN, Name.Variable),
            # End of docstring
            (r'"""', String.Doc, "#pop"),
            # Content
            (r'[^"${]+', String.Doc),
            # Quote not part of closing
            (r'"(?!"")', String.Doc),
            (r"[$\{]", String.Doc),
        ],
    }


def setup(app):
    """Setup function for MkDocs/Sphinx integration."""
    pass
