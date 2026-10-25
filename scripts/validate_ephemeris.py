import sys
import os
import glob
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

def find_latest_ephemeris():
    search_paths = [
        os.path.expanduser('~/Downloads/cr3bp_ephemeris_*.csv'),
        './cr3bp_ephemeris_*.csv'
    ]
    files = []
    for p in search_paths:
        files.extend(glob.glob(p))
    if not files:
        return None
    return max(files, key=os.path.getctime)

def compute_exact_jacobi(x, y, z, vx, vy, vz, mu):
    r1 = np.sqrt((x + mu)**2 + y**2 + z**2) + 1e-12
    r2 = np.sqrt((x - 1.0 + mu)**2 + y**2 + z**2) + 1e-12
    omega = 0.5 * (x**2 + y**2) + (1.0 - mu) / r1 + mu / r2
    v_sq = vx**2 + vy**2 + vz**2
    return 2.0 * omega - v_sq

def validate_and_plot(csv_path):
    print(f"Loading Ephemeris: {csv_path}")
    
    with open(csv_path, 'r') as f:
        lines = [f.readline() for _ in range(4)]
    
    system_name = lines[0].split('-')[-1].strip()
    mu = float(lines[1].split(':')[-1].strip())
    
    df = pd.read_csv(csv_path, skiprows=5)
    
    # Compute exact unrounded Jacobi Constant from state vectors
    exact_cj = compute_exact_jacobi(
        df['x_nd'].values, df['y_nd'].values, df['z_nd'].values,
        df['vx_nd'].values, df['vy_nd'].values, df['vz_nd'].values,
        mu
    )
    
    delta_cj = np.abs(exact_cj - exact_cj[0])
    # Add floating point epsilon so log scale never encounters literal 0 at step 0
    delta_cj_plot = np.maximum(delta_cj, 1e-14)
    
    max_drift = np.max(delta_cj)
    mean_drift = np.mean(delta_cj)
    
    print("-" * 50)
    print(f"CR3BP Dynamical Validation: {system_name}")
    print(f"Mass Parameter (μ) : {mu:.8e}")
    print(f"Initial Jacobi C_J : {exact_cj[0]:.8f}")
    print(f"Max Energy Drift   : {max_drift:.4e}")
    print(f"Mean Energy Drift  : {mean_drift:.4e}")
    print("-" * 50)
    
    fig = plt.figure(figsize=(14, 6), facecolor='#030712')
    
    # 2D Synodic Orbit Projection
    ax1 = fig.add_subplot(1, 2, 1, facecolor='#0b0f19')
    ax1.plot(df['x_nd'], df['y_nd'], color='#38bdf8', linewidth=1.5, label='Propagated Trajectory')
    ax1.scatter(df['x_nd'].iloc[0], df['y_nd'].iloc[0], color='#22c55e', s=45, zorder=5, label='Injection State')
    
    ax1.scatter([-mu], [0], color='#2563eb', s=120, zorder=6, label=r'Primary ($m_1$)')
    ax1.scatter([1 - mu], [0], color='#94a3b8', s=50, zorder=6, label=r'Secondary ($m_2$)')
    
    l1_x = 1 - (mu / 3)**(1/3)
    l2_x = 1 + (mu / 3)**(1/3)
    ax1.scatter([l1_x, l2_x], [0, 0], color='#eab308', marker='x', s=60, label=r'Libration Points ($L_1, L_2$)')
    
    ax1.set_title(f"Synodic Orbit: {system_name}", color='#f8fafc', fontsize=12, pad=12)
    ax1.set_xlabel("x (dimensionless)", color='#94a3b8')
    ax1.set_ylabel("y (dimensionless)", color='#94a3b8')
    ax1.tick_params(colors='#64748b')
    ax1.grid(True, color='#1e293b', linestyle='--', alpha=0.6)
    ax1.axis('equal')
    ax1.legend(facecolor='#030712', edgecolor='#1e293b', labelcolor='#cbd5e1', fontsize=8)
    
    # Symplectic Preservation Drift
    ax2 = fig.add_subplot(1, 2, 2, facecolor='#0b0f19')
    ax2.plot(df['step'], delta_cj_plot, color='#f43f5e', linewidth=1.2)
    ax2.set_yscale('log')
    ax2.set_title(r"Symplectic Energy Preservation: $|C_J(t) - C_J(0)|$", color='#f8fafc', fontsize=12, pad=12)
    ax2.set_xlabel("Integration Step", color='#94a3b8')
    ax2.set_ylabel(r"$\Delta C_J$ (Log Scale)", color='#94a3b8')
    ax2.tick_params(colors='#64748b')
    ax2.grid(True, color='#1e293b', linestyle='--', alpha=0.6)
    
    plt.tight_layout()
    output_png = "cr3bp_validation_plot.png"
    plt.savefig(output_png, dpi=200, bbox_inches='tight', facecolor=fig.get_facecolor())
    print(f"Validation plot generated: {output_png}")
    plt.show()

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else find_latest_ephemeris()
    if not path or not os.path.exists(path):
        print("No ephemeris CSV found. Please pass path explicitly.")
        sys.exit(1)
    validate_and_plot(path)
