'use client';
import { useEffect } from 'react';
import { vn, hasCJK } from '@/lib/i18n/vn';

/**
 * Việt hóa thuật ngữ động trên DOM.
 *
 * Engine trả tên sao/cung bằng chữ Hán (dùng làm khoá logic), nên sau khi React render,
 * component này quét text node + vài thuộc tính và chuyển thuật ngữ sang tiếng Việt bằng vn().
 * Chỉ sửa nodeValue tại chỗ (không thêm/xoá node) nên không xung đột với React reconciliation.
 * Vùng cần giữ nguyên chữ Hán (nguyên văn cổ thư) đánh dấu bằng thuộc tính data-han.
 */
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'NOSCRIPT', 'CODE', 'PRE']);

function skip(el: Element | null): boolean {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP_TAGS.has(e.tagName) || e.hasAttribute('data-han') || (e as HTMLElement).isContentEditable) return true;
  }
  return false;
}

// Ghi nhớ giá trị đã viết để không xử lý lại chính output của mình (tránh vòng lặp observer)
const written = new WeakMap<Node, string>();

function fixText(node: Text) {
  const v = node.nodeValue;
  if (!v || written.get(node) === v || !hasCJK(v) || skip(node.parentElement)) return;
  const out = vn(v);
  written.set(node, out);
  if (out !== v) node.nodeValue = out;
}

function fixAttrs(el: Element) {
  if (skip(el)) return;
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v && hasCJK(v) && el.getAttribute(`data-vi-${a}`) !== v) {
      const out = vn(v);
      if (out !== v) { el.setAttribute(`data-vi-${a}`, out); el.setAttribute(a, out); }
    }
  }
  if (el instanceof HTMLInputElement && (el.type === 'button' || el.type === 'submit') && hasCJK(el.value)) {
    el.value = vn(el.value);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { fixText(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  fixAttrs(el);
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    if (n.nodeType === Node.TEXT_NODE) fixText(n as Text);
    else fixAttrs(n as Element);
  }
}

let lastTitle = '';
function fixTitle() {
  const t = document.title;
  if (t === lastTitle || !hasCJK(t)) return;
  lastTitle = vn(t);
  if (lastTitle !== t) document.title = lastTitle;
}

export default function AutoVietnamese() {
  useEffect(() => {
    walk(document.body);
    fixTitle();
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'characterData') fixText(m.target as Text);
        else if (m.type === 'attributes') fixAttrs(m.target as Element);
        else m.addedNodes.forEach(walk);
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    const titleEl = document.querySelector('title');
    const mt = titleEl ? new MutationObserver(fixTitle) : null;
    if (titleEl && mt) mt.observe(titleEl, { childList: true, characterData: true, subtree: true });
    return () => { mo.disconnect(); mt?.disconnect(); };
  }, []);
  return null;
}
