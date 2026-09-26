"""
MkDocs hooks to register the PromptScript Pygments lexer.

This ensures the lexer is available during the MkDocs build process.
"""

import sys
from pathlib import Path

from pygments import highlight
from pygments.formatters import HtmlFormatter

# Add the docs_extensions directory to the path so we can import the lexer
docs_ext_path = Path(__file__).parent
if str(docs_ext_path) not in sys.path:
    sys.path.insert(0, str(docs_ext_path))

from promptscript_lexer import PromptScriptLexer


def format_promptscript(source, language, css_class, options, md, **kwargs):
    """
    Custom formatter for PromptScript code blocks.

    Used by pymdownx.superfences custom_fences.
    """
    lexer = PromptScriptLexer()
    formatter = HtmlFormatter(
        cssclass=css_class,
        wrapcode=True,
        linenos=options.get("linenos", False),
        lineanchors=options.get("lineanchors", ""),
    )
    return highlight(source, lexer, formatter)


def on_startup(command, dirty):
    """Hook called on MkDocs startup."""
    pass
