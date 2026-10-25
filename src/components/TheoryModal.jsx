import React, { useState, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function MathBlock({ math, display = true }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    try {
      const rendered = katex.renderToString(math, {
        displayMode: display,
        throwOnError: false
      });
      setHtml(rendered);
    } catch (e) {
      setHtml(math);
    }
  }, [math, display]);

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function TheoryModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('EQUATIONS');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(2, 6, 23, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#030712',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '860px',
        maxHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.5px' }}>
              MATHEMATICAL FORMALISM & ALGORITHMIC ARCHITECTURE
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Circular Restricted Three-Body Problem (CR3BP) & Invariant Manifold Theory
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              color: '#94a3b8',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            ✕ ESC
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #1e293b',
          backgroundColor: 'rgba(15, 23, 42, 0.6)'
        }}>
          {[
            { id: 'EQUATIONS', label: '1. CR3BP & Jacobi Constant' },
            { id: 'VARIATIONAL', label: '2. 42-State Variational Equations' },
            { id: 'CORRECTOR', label: '3. Single-Shooting Corrector' },
            { id: 'MONODROMY', label: '4. Monodromy & Invariant Tubes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 14px',
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                color: activeTab === tab.id ? '#38bdf8' : '#94a3b8',
                backgroundColor: activeTab === tab.id ? '#030712' : 'transparent',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid #38bdf8' : 'none',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div style={{
          padding: '24px',
          overflowY: 'auto',
          fontSize: '13px',
          lineHeight: '1.7',
          color: '#cbd5e1'
        }}>
          {activeTab === 'EQUATIONS' && (
            <div>
              <h3 style={{ color: '#f8fafc', margin: '0 0 10px 0', fontSize: '15px' }}>
                Synodic Frame Pseudo-Potential & Equations of Motion
              </h3>
              <p>
                In the non-dimensionalized synodic (rotating) reference frame, the two primary masses <MathBlock math="m_1" display={false} /> and <MathBlock math="m_2" display={false} /> are fixed on the <MathBlock math="x" display={false} />-axis at coordinates <MathBlock math="(-\mu, 0, 0)" display={false} /> and <MathBlock math="(1-\mu, 0, 0)" display={false} />, where the mass parameter is defined as:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\mu = \frac{m_2}{m_1 + m_2}" />
              </div>
              <p>
                The third infinitesimal mass moves governed by the effective pseudo-potential <MathBlock math="\Omega(x,y,z)" display={false} />, which incorporates both gravitational potentials and centrifugal acceleration:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\Omega(x, y, z) = \frac{1}{2}(x^2 + y^2) + \frac{1-\mu}{r_1} + \frac{\mu}{r_2}" />
              </div>
              <p>
                where <MathBlock math="r_1 = \sqrt{(x+\mu)^2 + y^2 + z^2}" display={false} /> and <MathBlock math="r_2 = \sqrt{(x - 1 + \mu)^2 + y^2 + z^2}" display={false} />. The dimensionless equations of motion are:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\ddot{x} - 2\dot{y} = \frac{\partial \Omega}{\partial x}, \quad \ddot{y} + 2\dot{x} = \frac{\partial \Omega}{\partial y}, \quad \ddot{z} = \frac{\partial \Omega}{\partial z}" />
              </div>
              <p>
                Taking the first integral of motion yields the <b>Jacobi Constant (<MathBlock math="C_J" display={false} />)</b>, an exact conserved quantity:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="C_J = 2\Omega(x, y, z) - (\dot{x}^2 + \dot{y}^2 + \dot{z}^2)" />
              </div>
              <p>
                The boundary <MathBlock math="2\Omega(x,y,z) = C_J" display={false} /> defines the <b>Zero-Velocity Surfaces</b> (Hill’s regions), forming topological bottlenecks at the libration points that govern low-energy transfers.
              </p>
            </div>
          )}

          {activeTab === 'VARIATIONAL' && (
            <div>
              <h3 style={{ color: '#f8fafc', margin: '0 0 10px 0', fontSize: '15px' }}>
                The 42-Dimensional Variational System
              </h3>
              <p>
                To calculate orbital sensitivity and target periodic orbits, we integrate the 6-state trajectory vector <MathBlock math="\mathbf{x}(t)" display={false} /> simultaneously with the <MathBlock math="6 \times 6" display={false} /> <b>State Transition Matrix (STM)</b> <MathBlock math="\Phi(t, t_0) = \frac{\partial \mathbf{x}(t)}{\partial \mathbf{x}(t_0)}" display={false} />:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\mathbf{X}_{42}(t) = \begin{bmatrix} \mathbf{x}(t) \\ \text{vec}(\Phi(t, t_0)) \end{bmatrix}_{42 \times 1}, \quad \Phi(t_0, t_0) = \mathbf{I}_6" />
              </div>
              <p>
                The time derivative of the STM is governed by the Jacobian matrix <MathBlock math="A(t) = \frac{\partial \mathbf{f}}{\partial \mathbf{x}}" display={false} />:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\dot{\Phi}(t, t_0) = A(t)\Phi(t, t_0), \quad A(t) = \begin{bmatrix} \mathbf{0}_{3\times 3} & \mathbf{I}_{3\times 3} \\ \mathbf{U}_{xx} & 2\mathbf{\Omega}_{\text{cor}} \end{bmatrix}" />
              </div>
              <p>
                where <MathBlock math="\mathbf{U}_{xx}" display={false} /> is the symmetric Hessian tensor of partial second derivatives:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\mathbf{U}_{xx} = \begin{bmatrix} \Omega_{xx} & \Omega_{xy} & \Omega_{xz} \\ \Omega_{xy} & \Omega_{yy} & \Omega_{yz} \\ \Omega_{xz} & \Omega_{yz} & \Omega_{zz} \end{bmatrix}, \quad 2\mathbf{\Omega}_{\text{cor}} = \begin{bmatrix} 0 & 2 & 0 \\ -2 & 0 & 0 \\ 0 & 0 & 0 \end{bmatrix}" />
              </div>
            </div>
          )}

          {activeTab === 'CORRECTOR' && (
            <div>
              <h3 style={{ color: '#f8fafc', margin: '0 0 10px 0', fontSize: '15px' }}>
                Single-Shooting Newton-Raphson Differential Corrector
              </h3>
              <p>
                Due to mirror symmetry about the <MathBlock math="xz" display={false} />-plane, a trajectory in the CR3BP that starts orthogonally on the <MathBlock math="x" display={false} />-axis (<MathBlock math="y_0 = 0, \dot{x}_0 = 0, \dot{z}_0 = 0" display={false} />) and crosses the <MathBlock math="xz" display={false} />-plane perpendicularly at half-period <MathBlock math="t = T/2" display={false} /> (<MathBlock math="\dot{x}(T/2) = 0" display={false} />) forms a closed, symmetric periodic orbit.
              </p>
              <p>
                Fixing the initial amplitude <MathBlock math="x_0" display={false} />, we correct the initial velocity <MathBlock math="\dot{y}_0" display={false} /> to drive the final velocity component <MathBlock math="\dot{x}(T/2) \to 0" display={false} />:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\delta \dot{x} = \Phi_{45} \delta \dot{y}_0 + \ddot{x} \delta t" />
              </div>
              <p>
                Because crossing occurs on the section <MathBlock math="y(t) = 0" display={false} />, the time variation satisfies <MathBlock math="\delta y = \Phi_{25} \delta \dot{y}_0 + \dot{y} \delta t = 0 \implies \delta t = -\frac{\Phi_{25}}{\dot{y}} \delta \dot{y}_0" display={false} />. Substituting yields:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\frac{d\dot{x}}{d\dot{y}_0} = \Phi_{45} - \frac{\ddot{x}}{\dot{y}}\Phi_{25}" />
              </div>
              <p>
                The Newton-Raphson correction step at iteration <MathBlock math="k" display={false} /> is therefore:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\dot{y}_0^{(k+1)} = \dot{y}_0^{(k)} - \frac{\dot{x}(T/2)}{\Phi_{45} - \frac{\ddot{x}}{\dot{y}}\Phi_{25}}" />
              </div>
              <p>
                The solver repeats until <MathBlock math="|\dot{x}(T/2)| < 10^{-6}" display={false} />, achieving quadratic convergence in 3–5 iterations.
              </p>
            </div>
          )}

          {activeTab === 'MONODROMY' && (
            <div>
              <h3 style={{ color: '#f8fafc', margin: '0 0 10px 0', fontSize: '15px' }}>
                Monodromy Matrix, Floquet Multipliers & Invariant Manifolds
              </h3>
              <p>
                Evaluating the State Transition Matrix over one complete orbital period <MathBlock math="T" display={false} /> defines the <b>Monodromy Matrix (<MathBlock math="\mathcal{M}" display={false} />)</b>:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\mathcal{M} = \Phi(T, 0)" />
              </div>
              <p>
                Because the system is Hamiltonian, <MathBlock math="\mathcal{M}" display={false} /> is symplectic (<MathBlock math="\mathcal{M}^T \mathbf{J} \mathcal{M} = \mathbf{J}" display={false} />). Its eigenvalues (Floquet multipliers) occur in reciprocal pairs:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\lambda_1 = \lambda_u > 1, \quad \lambda_2 = \lambda_s = \frac{1}{\lambda_u} < 1, \quad \lambda_{3,4} = 1, \quad \lambda_{5,6} = e^{\pm i\theta}" />
              </div>
              <p>
                The eigenvectors <MathBlock math="\mathbf{v}_u" display={false} /> and <MathBlock math="\mathbf{v}_s" display={false} /> associated with <MathBlock math="\lambda_u" display={false} /> and <MathBlock math="\lambda_s" display={false} /> define the local tangent spaces to the <b>unstable (<MathBlock math="\mathcal{W}^u" display={false} />)</b> and <b>stable (<MathBlock math="\mathcal{W}^s" display={false} />) invariant manifolds</b>.
              </p>
              <p>
                To generate the 3D manifold tubes, we step along the periodic orbit parameterized by phase angle <MathBlock math="\theta" display={false} /> and perturb along the normalized eigenvector:
              </p>
              <div style={{ margin: '14px 0', textAlign: 'center' }}>
                <MathBlock math="\mathbf{x}_0^{u,s}(\theta) = \mathbf{x}_{\text{orbit}}(\theta) \pm \epsilon \frac{\mathbf{v}_{u,s}(\theta)}{\|\mathbf{v}_{u,s}(\theta)\|}" />
              </div>
              <p>
                Integrating <MathBlock math="\mathbf{x}_0^u" display={false} /> forward in time (<MathBlock math="t > 0" display={false} />) generates the unstable manifold tube (magenta), while integrating <MathBlock math="\mathbf{x}_0^s" display={false} /> backward in time (<MathBlock math="t < 0" display={false} />) generates the stable manifold tube (cyan)—forming the ballistic trajectories of the Interplanetary Transport Network.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#030712'
        }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            REFERENCES: Howell (1984) Cel. Mech. | Koon, Lo, Marsden & Ross (2000) Chaos
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 16px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
