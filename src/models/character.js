// Nhân vật chibi: đầu to, thân nhỏ. avatar = { skin, hair, outfit, hat }
import * as THREE from 'three';
import { sphere, cyl, capsule, rbox, at } from './primitives.js';

export function buildCharacter(avatar) {
  const { skin, hair, outfit, hat } = avatar;
  const root = new THREE.Group();
  const body = new THREE.Group(); // nhún nhảy khi đi
  root.add(body);

  // chân
  const legL = at(capsule(0.09, 0.14, '#7d6a5e'), -0.12, 0.17, 0);
  const legR = at(capsule(0.09, 0.14, '#7d6a5e'), 0.12, 0.17, 0);
  body.add(legL, legR);
  // thân
  const torso = at(capsule(0.24, 0.18, outfit), 0, 0.52, 0);
  torso.scale.set(1, 1, 0.85);
  body.add(torso);
  body.add(at(rbox(0.3, 0.16, 0.06, '#ffffff', 0.03), 0, 0.55, 0.2)); // túi áo
  // tay
  const armL = new THREE.Group(); armL.position.set(-0.28, 0.65, 0);
  armL.add(at(capsule(0.075, 0.18, outfit), 0, -0.13, 0));
  armL.add(at(sphere(0.08, skin, 8), 0, -0.28, 0));
  const armR = new THREE.Group(); armR.position.set(0.28, 0.65, 0);
  armR.add(at(capsule(0.075, 0.18, outfit), 0, -0.13, 0));
  armR.add(at(sphere(0.08, skin, 8), 0, -0.28, 0));
  body.add(armL, armR);
  const hand = new THREE.Group(); hand.position.set(0, -0.3, 0.05);
  armR.add(hand);

  // đầu to
  const head = new THREE.Group(); head.position.y = 1.12;
  body.add(head);
  head.add(sphere(0.42, skin, 18));
  const hairCap = sphere(0.44, hair, 18);
  hairCap.scale.set(1, 0.82, 1);
  hairCap.position.set(0, 0.1, -0.06);
  head.add(hairCap);
  const bangs = sphere(0.2, hair, 10); bangs.scale.set(1.6, 0.55, 0.7); bangs.position.set(0, 0.25, 0.3);
  head.add(bangs);
  // mắt, má, miệng
  const eyeM = '#3b2a22';
  for (const x of [-0.15, 0.15]) {
    const e = at(sphere(0.06, eyeM, 10), x, -0.02, 0.37); e.scale.set(0.85, 1.2, 0.5); head.add(e);
    head.add(at(sphere(0.02, '#ffffff', 6), x + 0.02, 0.02, 0.4));
    const c = at(sphere(0.06, '#ffab9c', 8), x * 1.55, -0.12, 0.33); c.scale.set(1, 0.6, 0.4); head.add(c);
  }
  head.add(at(sphere(0.025, '#c96a5a', 6), 0, -0.14, 0.4));
  // búi tóc (tùy chọn)
  if (avatar.bun) {
    head.add(at(sphere(0.17, hair, 12), 0, 0.42, -0.18));
  }
  // mũ rơm (hat = null => không đội mũ)
  if (hat) {
    const hatG = new THREE.Group(); hatG.position.y = 0.3; hatG.rotation.x = -0.12;
    hatG.add(cyl(0.62, 0.62, 0.05, hat, 20));
    hatG.add(at(cyl(0.3, 0.36, 0.26, hat, 16), 0, 0.14, 0));
    hatG.add(at(cyl(0.365, 0.37, 0.07, '#f28da0', 16), 0, 0.06, 0));
    head.add(hatG);
  }

  root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { root, body, head, armL, armR, legL, legR, hand };
}

/** Dụng cụ cầm tay */
export function buildTool(kind) {
  const g = new THREE.Group();
  if (kind === 'shovel') {
    g.add(at(cyl(0.025, 0.025, 0.6, '#b98563', 6), 0, -0.1, 0));
    g.add(at(rbox(0.18, 0.22, 0.04, '#aeb7c2', 0.04), 0, -0.45, 0));
  } else if (kind === 'water') {
    g.add(at(cyl(0.13, 0.15, 0.24, '#7fc3e6', 12), 0, -0.1, 0.12));
    const spout = cyl(0.025, 0.04, 0.3, '#7fc3e6', 6); spout.rotation.x = 1.0; spout.position.set(0, -0.05, 0.35);
    g.add(spout);
  } else if (kind === 'fertilize') {
    const bag = sphere(0.14, '#c9a27e', 10); bag.scale.set(1, 1.2, 0.8); bag.position.set(0, -0.1, 0.1);
    g.add(bag);
  } else if (kind === 'plant') {
    g.add(at(sphere(0.08, '#f3e1b5', 8), 0, -0.05, 0.05));
  } else if (kind === 'harvest') {
    const basket = cyl(0.16, 0.12, 0.16, '#d9a67e', 12); basket.position.set(0, -0.1, 0.1);
    g.add(basket);
  }
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}
