# VEIL Steganography Algorithm Specification

## 1. Pixel Channel Traversal

VEIL uses sequential 1-bit Least Significant Bit (LSB) embedding across uncompressed raster color channels:

1. **Carrier Normalization**: The image is decoded into a 32-bit `BufferedImage.TYPE_INT_ARGB` or 24-bit `BufferedImage.TYPE_INT_RGB` representation.
2. **Channel Selection**:
   - Channel 0: **Red** (Bits 16..23)
   - Channel 1: **Green** (Bits 8..15)
   - Channel 2: **Blue** (Bits 0..7)
   - **Alpha Channel** (Bits 24..31) is **never modified**. This avoids transparency corruption, visual artifacts, and PNG alpha decoding glitches.
3. **Raster Traversal Order**:
   - Outer loop: Row by row (`y` from 0 to `height - 1`)
   - Inner loop: Column by column (`x` from 0 to `width - 1`)
   - Per pixel: Red channel LSB $\rightarrow$ Green channel LSB $\rightarrow$ Blue channel LSB

---

## 2. Bit Ordering

Each byte of the serialized binary envelope is unpacked Most Significant Bit (MSB) first:
- Bit 7 $\rightarrow$ Channel LSB
- Bit 6 $\rightarrow$ Channel LSB
- ...
- Bit 0 $\rightarrow$ Channel LSB

To set the LSB:
$$\text{channelValue}' = (\text{channelValue} \ \& \ \text{0xFE}) \ | \ \text{bitValue}$$

To extract the LSB:
$$\text{bitValue} = \text{channelValue} \ \& \ 1$$

---

## 3. Capacity Calculation Formulation

For an image with width $W$ and height $H$:

$$\text{Total Pixels} = W \times H$$
$$\text{Total Available Bits} = W \times H \times 3$$
$$\text{Raw Capacity (Bytes)} = \left\lfloor \frac{W \times H \times 3}{8} \right\rfloor$$

$$\text{Minimum Framing Overhead} = 42 \text{ B (Envelope)} + 16 \text{ B (GCM Tag)} + 8 \text{ B (Plaintext Header)} = 66 \text{ Bytes}$$

$$\text{Usable Capacity} = \max(0, \text{Raw Capacity} - 66 - \text{filenameLength})$$

$$\text{Capacity Utilization (\%)} = \left( \frac{\text{Payload Size} + \text{Overhead}}{\text{Raw Capacity}} \right) \times 100$$
