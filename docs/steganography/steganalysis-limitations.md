# Statistical Steganalysis & Chi-Square (PoV) Limitations

## 1. Executive Summary

Digital steganography aims to embed covert information within carrier mediums without drawing statistical suspicion. VEIL provides automated statistical analysis via Andreas Westfeld's **Pairs of Values (PoV) $\chi^2$ test** and Sample Pair distribution metrics.

This document formally records the mathematical foundations of the PoV attack, explains why VEIL's keyed pseudo-random scatter strategy (`KEYED_SCATTER_LSB_V1`) resists simple first-order tests, and establishes the strict methodological limitations of statistical steganalysis.

---

## 2. Mathematical Foundation of the Pairs of Values (PoV) $\chi^2$ Attack

### 2.1 Principle of Adjacent Value Equalization
In natural, uncompressed images, the frequency of adjacent pixel intensity values $2k$ and $2k+1$ (where $k \in [0, 127]$) is generally unequal due to ambient illumination, continuous gradients, surface textures, and sensor shot noise. That is:
$$h(2k) \ne h(2k+1)$$

When secret data bits are substituted into the Least Significant Bit (LSB) of pixel color channels, an even value $2k$ ($LSB = 0$) either remains $2k$ (if secret bit is 0) or becomes $2k+1$ (if secret bit is 1). Similarly, an odd value $2k+1$ ($LSB = 1$) either becomes $2k$ (if secret bit is 0) or remains $2k+1$ (if secret bit is 1).

Assuming ciphertext bits have maximal Shannon entropy ($\Pr[b = 0] = \Pr[b = 1] = 0.5$, guaranteed by AES-256-GCM), complete LSB replacement forces the expected frequency of both values in any pair to converge to their arithmetic mean:
$$E_k = \frac{h(2k) + h(2k+1)}{2}$$

### 2.2 The $\chi^2$ Test Statistic
The theoretical test statistic measures deviation between the observed frequencies and expected equalized frequencies:
$$\chi^2 = \sum_{k=0}^{127} \frac{(h(2k) - E_k)^2}{E_k} = \sum_{k=0}^{127} \frac{(h(2k) - h(2k+1))^2}{2(h(2k) + h(2k+1))}$$
for all pairs where $h(2k) + h(2k+1) > 0$.

The degrees of freedom $v$ equals the number of active pairs minus 1 ($v \le 127$). The $p$-value represents the probability that the observed distribution is consistent with the hypothesis of uniform equalization:
$$p = Q\left(\frac{v}{2}, \frac{\chi^2}{2}\right) = 1 - P\left(\frac{v}{2}, \frac{\chi^2}{2}\right) = \frac{\Gamma(v/2, \chi^2/2)}{\Gamma(v/2)}$$
computed via the regularized upper incomplete gamma function $Q(a, x)$.

### 2.3 Diagnostic Interpretation
- **Natural Unmodified Image**: Large differences $|h(2k) - h(2k+1)|$ yield a high $\chi^2$ value relative to $v$, producing $p \to 1.0$. The hypothesis of equalized pairs is rejected.
- **Sequential LSB Embedded Image**: Equalization reduces $|h(2k) - h(2k+1)| \approx 0$, collapsing $\chi^2$ below natural levels. When evaluated over the embedded segment, $p \to 0.0$, indicating artificial equalization with high confidence.

---

## 3. Defense Analysis: Keyed Scatter vs. Sequential Embedding

VEIL implements two embedding strategies:
1. `SEQUENTIAL_LSB_V1` (Legacy): Modifies channel bits raster-order from $(0,0)$ sequentially.
2. `KEYED_SCATTER_LSB_V1` (Hardened): Preserves a fixed 43-byte bootstrap header at $(0,0)$ and scatters the remaining ciphertext across the entire spatial carrier using a 6-round cycle-walking Feistel permutation keyed by HKDF.

### 3.1 Resistance to Global PoV Tests
Under `SEQUENTIAL_LSB_V1`, a 10% capacity payload completely flattens the first 10% of the image raster. A sliding-window PoV analysis detects an abrupt statistical transition between the embedded prefix and unmodified suffix.

Under `KEYED_SCATTER_LSB_V1`, bits are distributed uniformly across all available channels:
$$\Pr[\text{Channel } c \text{ is modified}] = \frac{\text{Payload Bits}}{2 \times \text{Available Carrier Bits}} = \frac{\rho}{2}$$
where $\rho \in (0, 1]$ is the embedding capacity utilization.

For low-to-moderate embedding rates ($\rho \le 0.15$), the perturbation to each histogram bin count is bounded by $O(\sqrt{N})$, preventing first-order global $\chi^2$ statistics from triggering anomaly thresholds.

---

## 4. Strict Scientific Limitations

### Limitation 1: Pseudo-Random Embedding is NOT Undetectable
While keyed pseudo-random scattering prevents localized PoV detection, **it does not render steganography undetectable**.
- **Higher-Order Steganalysis**: Natural images possess high spatial correlation between neighboring pixels. LSB replacement destroys second-order and higher-order correlations.
- **Sample Pair Analysis (SPA) & RS Analysis**: Techniques analyzing differences between adjacent pixel pairs ($|P(x+1, y) - P(x, y)|$) detect subtle alterations in even/odd parity transitions even when scattered uniformly across the image.
- **Feature-Based & Deep Learning Detectors**: Modern steganalysis architectures (Spatial Rich Models - SRM, and convolutional neural networks such as XuNet, YeNet, or SRNet) extract thousands of co-occurrence features and spatial residuals that detect keyed LSB embedding even at payload ratios under 5%.

### Limitation 2: A Clean $\chi^2$ Test Does NOT Prove an Image is Safe
A report showing $p \approx 1.0$ and "No significant first-order anomaly detected" **only** certifies that full-raster Pairs-of-Values equalization is absent. It provides **zero guarantee** that:
- Keyed scattered data is not present at lower capacities.
- Transform-domain steganography (DCT/DWT) is not present.
- Parity-check or matrix-embedding steganography was not used.

### Limitation 3: False Positives on Synthetic and Quantized Graphics
The PoV test assumes continuous-tone natural photographic imagery:
- **Computer-Generated Images (CGI)**: Flat shading, solid backgrounds, and vector illustrations frequently contain identical color counts or sharp geometric gradients where certain pairs have artificially equal counts, producing false-positive detections.
- **Color-Quantized & Palette Images**: Images saved through quantization tables (e.g. 256-color palettes) exhibit irregular histograms that invalidate continuous statistical assumptions.

---

## 5. Security & Engineering Recommendations

1. **Carrier Selection**: Always select continuous-tone, highly textured, high-resolution photographic images (e.g., foliage, fabric, urban textures) rather than smooth gradients or artificial graphics. High entropy natural carriers make spatial perturbations indistinguishable from camera sensor noise.
2. **Capacity Bounding**: Keep capacity utilization strictly under **10%** ($\rho < 0.10$). Higher payload densities alter high-order spatial residuals regardless of permutation.
3. **Defense in Depth**: Rely on AES-256-GCM authenticated encryption and Argon2id key derivation so that even if steganographic presence is suspected or detected by an adversary, the confidential plaintext remains computationally inaccessible.
