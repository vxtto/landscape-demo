import { PROJECT_LOGO_FILES } from "./project-logo-manifest";

export function projectLogoUrl(owner: string) {
  const normalizedOwner = owner.toLowerCase();
  const cachedFile = PROJECT_LOGO_FILES[normalizedOwner];

  if (cachedFile) {
    return `/project-logos/${encodeURIComponent(cachedFile)}`;
  }

  return projectLogoProxyUrl(normalizedOwner);
}

export function projectLogoProxyUrl(owner: string) {
  return `/api/project-logo/${encodeURIComponent(owner.toLowerCase())}`;
}
