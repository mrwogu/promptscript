"""
MkDocs hooks to register the PromptScript Pygments lexer.

This ensures the lexer is available during the MkDocs build process.
"""

import os
import re
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


def on_page_content(html, page, config, files):
    """
    Hook called after page content is rendered.

    Replaces playground URLs in page content based on DOCS_VERSION.
    When DOCS_VERSION=dev, playground links become playground-dev.
    """
    docs_version = os.environ.get("DOCS_VERSION", "")

    if docs_version == "dev":
        html = _replace_playground_urls(html)

    return html


def on_post_page(output, page, config):
    """
    Hook called after the full page (with template) is rendered.

    Replaces playground URLs in navigation and other template elements.
    When DOCS_VERSION=dev, playground links become playground-dev.
    """
    docs_version = os.environ.get("DOCS_VERSION", "")

    if docs_version == "dev":
        output = _replace_playground_urls(output)

    return output


def _replace_playground_urls(html):
    """
    Replace playground URLs with playground-dev URLs.

    Handles both full URLs (https://getpromptscript.dev/playground/)
    and relative URLs (/playground/).
    """
    # Replace full URLs: https://getpromptscript.dev/playground/
    html = re.sub(
        r'(https://getpromptscript\.dev)/playground/',
        r'\1/playground-dev/',
        html
    )
    # Replace quoted relative URLs: href="/playground/"
    # Negative lookahead to avoid matching playground-dev
    html = re.sub(
        r'(href=")(/playground/)(?!dev)',
        r'\1/playground-dev/',
        html
    )
    # Replace unquoted relative URLs (minified HTML): href=/playground/
    html = re.sub(
        r'(href=)(/playground/)(?!dev)',
        r'\1/playground-dev/',
        html
    )
    return html
