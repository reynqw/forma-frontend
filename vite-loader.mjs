import { tmpdir } from 'os';
import { basename, join } from 'path';
import { pathToFileURL } from 'url';

export function resolve(specifier, context, nextResolve) {
  if (specifier.includes('.timestamp-') && specifier.endsWith('.mjs')) {
    try {
      const url = new URL(specifier);
      const tmpPath = join(tmpdir(), basename(url.pathname));
      return { url: pathToFileURL(tmpPath).href, shortCircuit: true };
    } catch {
      // not a URL, try as path
      const tmpPath = join(tmpdir(), basename(specifier));
      return { url: pathToFileURL(tmpPath).href, shortCircuit: true };
    }
  }
  return nextResolve(specifier, context);
}
