import * as THREE from 'three';

/**
 * Building — western storefront box with a full-facade brand-logo texture
 * (GitHub/LinkedIn), with AABB collision data. The Storefront.js generator
 * covers every other (non-logo) storefront now, so this class only ever
 * needs to handle the logo case in practice.
 */
export class Building {
  constructor({ position, width = 6, depth = 5, height = 7, color = 0xc8a96e, projectId = null, logo = null }) {
    this.projectId = projectId;
    this.group = new THREE.Group();
    this.group.position.set(position.x, 0, position.z);

    // Main body
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(width, height, depth),
      new THREE.MeshLambertMaterial({ color })
    );
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    this.group.add(body);

    // Roof overhang
    const roofColor = logo ? 0x1a1a1a : 0x6b3a1f;
    const roof = new THREE.Mesh(
      new THREE.BoxGeometry(width + 1.2, 0.4, depth + 1),
      new THREE.MeshLambertMaterial({ color: roofColor })
    );
    roof.position.y = height + 0.2;
    roof.castShadow = true;
    this.group.add(roof);

    this._addCornerTrim(width, depth, height);
    this._addPorchPosts(width, depth, height);

    if (logo === 'github') {
      this._addGithubFacade(width, depth, height);
    } else if (logo === 'linkedin') {
      this._addLinkedinFacade(width, depth, height);
    } else if (logo === 'devpost') {
      this._addDevpostFacade(width, depth, height);
    }

    // AABB for collision
    const half = { x: width / 2, z: depth / 2 };
    this.boundingBox = {
      minX: position.x - half.x,
      maxX: position.x + half.x,
      minZ: position.z - half.z,
      maxZ: position.z + half.z,
    };

    this.doorPosition = new THREE.Vector3(position.x, 0, position.z + depth / 2);
  }

  /** Thin trim posts running up each of the four wall corners. */
  _addCornerTrim(width, depth, height) {
    const trimMat = new THREE.MeshLambertMaterial({ color: 0x3a2410 });
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.14, height, 0.14), trimMat);
      trim.position.set(sx * width / 2, height / 2, sz * depth / 2);
      trim.castShadow = true;
      this.group.add(trim);
    });
  }

  /** Two porch posts holding up the roof overhang, western-storefront style. */
  _addPorchPosts(width, depth, height) {
    const postMat = new THREE.MeshLambertMaterial({ color: 0x3a2410 });
    const postHeight = height + 0.2;
    [-1, 1].forEach((side) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, postHeight, 0.22), postMat);
      post.position.set(side * (width / 2 - 0.5), postHeight / 2, depth / 2 + 0.35);
      post.castShadow = true;
      this.group.add(post);
    });
  }

  _addLinkedinFacade(width, depth, height) {
    const SIZE = 512;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    // LinkedIn blue background
    ctx.fillStyle = '#0a66c2';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // LinkedIn "in" logo — white rounded square + letterform
    const LOGO = 200;
    const lx = (SIZE - LOGO) / 2;
    const ly = SIZE * 0.08;
    const r = LOGO * 0.18;

    // Rounded square
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(lx + r, ly);
    ctx.lineTo(lx + LOGO - r, ly);
    ctx.quadraticCurveTo(lx + LOGO, ly, lx + LOGO, ly + r);
    ctx.lineTo(lx + LOGO, ly + LOGO - r);
    ctx.quadraticCurveTo(lx + LOGO, ly + LOGO, lx + LOGO - r, ly + LOGO);
    ctx.lineTo(lx + r, ly + LOGO);
    ctx.quadraticCurveTo(lx, ly + LOGO, lx, ly + LOGO - r);
    ctx.lineTo(lx, ly + r);
    ctx.quadraticCurveTo(lx, ly, lx + r, ly);
    ctx.closePath();
    ctx.fill();

    // "in" letterform in LinkedIn blue
    ctx.fillStyle = '#0a66c2';
    const u = LOGO / 44; // unit based on LinkedIn's 44×44 viewBox
    ctx.save();
    ctx.translate(lx, ly);

    // dot above i
    ctx.beginPath();
    ctx.arc(9.5 * u, 10 * u, 3 * u, 0, Math.PI * 2);
    ctx.fill();
    // i stem
    ctx.fillRect(7 * u, 15 * u, 5 * u, 19 * u);
    // n
    ctx.fillRect(17 * u, 15 * u, 5 * u, 19 * u);
    // n arch
    ctx.beginPath();
    ctx.arc(27.5 * u, 20.5 * u, 5.5 * u, Math.PI, 0);
    ctx.fillRect(22 * u, 15 * u, 11 * u, 5.5 * u);
    ctx.fillRect(33 * u, 15 * u, 5 * u, 19 * u);
    ctx.fill();

    ctx.restore();

    // "LinkedIn" wordmark
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(SIZE * 0.1)}px -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LinkedIn', SIZE / 2, SIZE * 0.82);

    const facadeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.3, height - 0.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
    );
    facadeMesh.position.set(0, height / 2, depth / 2 + 0.06);
    this.group.add(facadeMesh);
  }

  _addGithubFacade(width, depth, height) {
    const SIZE = 512;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    // GitHub dark background
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // GitHub Invertocat logo via Path2D (24×24 viewBox, scaled to ~220px)
    const LOGO_PX = 220;
    const scale = LOGO_PX / 24;
    ctx.save();
    ctx.translate((SIZE - LOGO_PX) / 2, SIZE * 0.1);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fill(new Path2D(
      'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385' +
      '.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61' +
      '-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729' +
      '.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305' +
      ' 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466' +
      '-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0' +
      ' 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3' +
      ' .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176' +
      '.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81' +
      ' 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57' +
      'C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12'
    ));
    ctx.restore();

    // "GitHub" wordmark below the logo
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(SIZE * 0.1)}px -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GitHub', SIZE / 2, SIZE * 0.82);

    const facadeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.3, height - 0.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
    );
    facadeMesh.position.set(0, height / 2, depth / 2 + 0.06);
    this.group.add(facadeMesh);
  }

  /** Brand colors and logo path confirmed via web search: Devpost's palette
   * is #57C1FF (Malibu), #98A3F3 (Portage), #003E53 (Sherpa Blue); the mark
   * is a hexagonal badge with a "D" cut into it (24x24 viewBox). */
  _addDevpostFacade(width, depth, height) {
    const SIZE = 512;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE; canvas.height = SIZE;
    const ctx = canvas.getContext('2d');

    // Devpost dark teal background
    ctx.fillStyle = '#003e53';
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Devpost hexagonal badge mark via Path2D (24×24 viewBox, scaled to ~220px)
    const LOGO_PX = 220;
    const scale = LOGO_PX / 24;
    ctx.save();
    ctx.translate((SIZE - LOGO_PX) / 2, SIZE * 0.1);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#57c1ff';
    ctx.fill(new Path2D(
      'M6.002 1.61L0 12.004 6.002 22.39h11.996L24 12.004 17.998 1.61zm1.593 4.084h3.947' +
      'c3.605 0 6.276 1.695 6.276 6.31 0 4.436-3.21 6.302-6.456 6.302H7.595zm2.517 2.449v7.714' +
      'h1.241c2.646 0 3.862-1.55 3.862-3.861.009-2.569-1.096-3.853-3.767-3.853Z'
    ));
    ctx.restore();

    // "Devpost" wordmark below the logo
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(SIZE * 0.1)}px -apple-system, "Segoe UI", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Devpost', SIZE / 2, SIZE * 0.82);

    const facadeMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.3, height - 0.4),
      new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas) })
    );
    facadeMesh.position.set(0, height / 2, depth / 2 + 0.06);
    this.group.add(facadeMesh);
  }

  addTo(scene) {
    scene.add(this.group);
  }
}
