# CR3BP Astrodynamics Laboratory: Invariant Manifolds & Differential Correction

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Live%20Demo-blue?style=for-the-badge&logo=vercel)](https://lagrange-mission-designer.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![WebGL](https://img.shields.io/badge/WebGL-Three.js%20%2F%20React%20Three%20Fiber-purple?style=for-the-badge&logo=three.js)](https://threejs.org/)

An academic-grade computational astrodynamics workbench modeling non-linear orbital dynamics in the **Circular Restricted Three-Body Problem (CR3BP)** across the Earth–Moon, Sun–Earth, and Jupiter–Europa systems.

The workbench simulates low-energy ballistic transfers, computes topological Zero-Velocity Hill surfaces, solves for closed periodic Halo and Lyapunov orbits via a **Newton-Raphson Single-Shooting Differential Corrector**, extracts the invariant manifold tubes ($\mathcal{W}^s, \mathcal{W}^u$) of the Interplanetary Transport Network via **Monodromy Matrix eigensystem analysis**, and provides an interactive **Poincaré Surface of Section ($\Sigma: y = 0, \dot{y} > 0$)** with dynamic phase-space state seeding.

---

## Mathematical Formulation

### 1. Dimensionless Synodic Equations of Motion
In a rotating frame where primary bodies $m_1$ and $m_2$ are fixed at $(-\mu, 0, 0)$ and $(1-\mu, 0, 0)$ with mass parameter $\mu = \frac{m_2}{m_1 + m_2}$, the motion of an infinitesimal third body is governed by the effective pseudo-potential $\Omega(x, y, z)$:

$$\Omega(x, y, z) = \frac{1}{2}(x^2 + y^2) + \frac{1-\mu}{r_1} + \frac{\mu}{r_2}$$

where:
$$r_1 = \sqrt{(x+\mu)^2 + y^2 + z^2}, \quad r_2 = \sqrt{(x - 1 + \mu)^2 + y^2 + z^2}$$

The vector equations of motion reduce to:

$$\ddot{x} - 2\dot{y} = \frac{\partial \Omega}{\partial x}, \quad \ddot{y} + 2\dot{x} = \frac{\partial \Omega}{\partial y}, \quad \ddot{z} = \frac{\partial \Omega}{\partial z}$$

### 2. Conserved Jacobi Integral & Zero-Velocity Surfaces
The system admits a single scalar invariant of motion, the **Jacobi Constant ($C_J$)**:

$$C_J = 2\Omega(x, y, z) - (\dot{x}^2 + \dot{y}^2 + \dot{z}^2)$$

Setting velocity $v = 0$ yields the **Zero-Velocity Surfaces** ($2\Omega(x, y, z) = C_J$), which delineate forbidden Hill regions and govern the geometric opening of transit necks at the collinear Lagrange libration points ($L_1, L_2, L_3$).

---

## Computational Architecture

```text
 ┌────────────────────────────────────────────────────────┐
 │            Synodic Propagation Pipeline                │
 └──────────────────────────┬─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
 ┌──────────────────────┐        ┌──────────────────────┐
 │  42-State Variational│        │ 6-State Symplectic   │
 │  Integration (RK4)   │        │ Propagation (RK4)    │
 └──────────┬───────────┘        └──────────┬───────────┘
            │                               │
            ▼                               ▼
 ┌──────────────────────┐        ┌──────────────────────┐
 │  Monodromy Matrix    │        │  Poincaré Section    │
 │  M = Φ(T, 0)         │        │  Σ: y = 0, ẏ > 0     │
 └──────────┬───────────┘        └──────────┬───────────┘
            │                               │
            ▼                               ▼
 ┌──────────────────────┐        ┌──────────────────────┐
 │ Invariant Manifolds  │        │ Phase-Space Seeding  │
 │  (Wˢ, Wᵘ Tube Mesh)  │        │ & Ephemeris Exports  │
 └──────────────────────┘        └──────────────────────┘
```

### 3. 42-State Variational Sensitivity System
To determine orbital stability and target periodic boundary values, the laboratory integrates the 6-state orbital vector alongside the $6 \times 6$ **State Transition Matrix (STM)** $\Phi(t, t_0)$:

$$\mathbf{X}_{42}(t) = \begin{bmatrix} \mathbf{x}(t) \\ \text{vec}(\Phi(t, t_0)) \end{bmatrix}, \quad \Phi(t_0, t_0) = \mathbf{I}_6$$

$$\dot{\Phi}(t, t_0) = A(t)\Phi(t, t_0), \quad A(t) = \begin{bmatrix} \mathbf{0}_{3\times 3} & \mathbf{I}_{3\times 3} \\ \mathbf{U}_{xx} & 2\mathbf{\Omega}_{\text{cor}} \end{bmatrix}$$

where $\mathbf{U}_{xx}$ is the symmetric pseudo-potential Hessian tensor and $2\mathbf{\Omega}_{\text{cor}}$ represents Coriolis coupling.

### 4. Newton-Raphson Differential Corrector
Exploiting mirror symmetry across the synodic $xz$-plane ($y_0 = 0, \dot{x}_0 = 0, \dot{z}_0 = 0$), a periodic orbit satisfies $\dot{x}(T/2) = 0$ upon piercing the section $y = 0$. 

Fixing initial displacement $x_0$, the solver applies a first-order variational sensitivity correction to initial velocity $\dot{y}_0$:

$$\dot{y}_0^{(k+1)} = \dot{y}_0^{(k)} - \frac{\dot{x}(T/2)}{\Phi_{45} - \frac{\ddot{x}}{\dot{y}}\Phi_{25}}$$

Convergence is achieved quadratically when $|\dot{x}(T/2)| < 10^{-6}$.

### 5. Monodromy Eigensystem & Manifold Tube Generation
Evaluating the STM over one complete period yields the **Monodromy Matrix**:

$$\mathcal{M} = \Phi(T, 0)$$

Its reciprocal eigenvalues ($\lambda_u > 1, \lambda_s = 1/\lambda_u < 1$) and associated eigenvectors define the local tangent directions to the **unstable ($\mathcal{W}^u$)** and **stable ($\mathcal{W}^s$) invariant manifolds**. Displacing states along $\mathbf{v}_{u,s}$ by perturbation $\epsilon = 10^{-4}$ and integrating backward/forward generates the 3D manifold tubes of the Interplanetary Transport Network.

---

## Features

* **Real-Time 3D Synodic Viewport:** Built with React Three Fiber, WebGL, and custom GLSL atmospheric shaders. Displays primary and secondary bodies, barycentric rotation vector ($\mathbf{\omega} = \hat{\mathbf{z}}$), libration points ($L_1 \dots L_5$), and Zero-Velocity surfaces.
* **Interactive Poincaré Surface of Section:** 2D companion phase-portrait mapping $(x, \dot{x})$ crossings at $y=0, \dot{y}>0$. Features dynamic click-to-seed energy reconstruction ($2\Omega - C_J - \dot{x}^2 = \dot{y}^2$) to explore KAM stability islands versus chaotic seas.
* **Mission Presets:** Pre-configured initial conditions including $L_1$ Lyapunov orbits, Ballistic Lunar Transfers (BLT), Artemis Gateway Near-Rectilinear Halo Orbits (NRHO), and chaotic regimes.
* **Integrated KaTeX Theory Modal:** Complete pedagogical derivation of CR3BP equations, variational sensitivity formulations, and Floquet multipliers rendered via LaTeX.
* **Ephemeris Data Pipeline:** 1-click export of simulation trajectories to CSV and JSON formats containing non-dimensional coordinates, physical kilometer coordinates, velocities, and Jacobi constants, ready for external validation in Python (`scipy`, `astropy`, `poliastro`).

---

## Quickstart

```bash
git clone https://github.com/wtfchristina/lagrange-mission-designer.git
cd lagrange-mission-designer
npm install
npm run dev
```

---

## References

1. **Howell, K. C. (1984).** *"Three-Dimensional, Periodic, 'Halo' Orbits."* Celestial Mechanics, 32(1), 53–71.
2. **Koon, W. S., Lo, M. W., Marsden, J. E., & Ross, S. D. (2000).** *"Heteroclinic connections between periodic orbits and resonance transitions in celestial mechanics."* Chaos, 10(2), 427–469.
3. **Szebehely, V. (1967).** *"Theory of Orbits: The Restricted Problem of Three Bodies."* Academic Press.

---

## License
MIT License. Developed by Christina Holt.
