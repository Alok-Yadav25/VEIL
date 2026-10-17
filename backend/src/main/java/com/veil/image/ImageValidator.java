package com.veil.image;

import com.veil.config.VeilProperties;
import com.veil.exception.InvalidCarrierException;
import org.springframework.stereotype.Component;

import java.awt.image.BufferedImage;
import java.util.Arrays;

@Component
public class ImageValidator {

    private static final byte[] PNG_SIGNATURE = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] BMP_SIGNATURE = new byte[]{0x42, 0x4D};

    private final VeilProperties properties;

    public ImageValidator(VeilProperties properties) {
        this.properties = properties;
    }

    public void validateImageBytes(byte[] bytes) {
        if (bytes == null || bytes.length < 8) {
            throw new InvalidCarrierException("Image file is empty or corrupted");
        }

        boolean isPng = bytes.length >= 8 && Arrays.equals(Arrays.copyOf(bytes, 8), PNG_SIGNATURE);
        boolean isBmp = bytes.length >= 2 && bytes[0] == BMP_SIGNATURE[0] && bytes[1] == BMP_SIGNATURE[1];

        if (!isPng && !isBmp) {
            throw new InvalidCarrierException("Unsupported image format. VEIL supports lossless PNG and BMP images.");
        }
    }

    public void validateDimensions(BufferedImage image) {
        if (image == null) {
            throw new InvalidCarrierException("Failed to decode image data into pixels");
        }

        int width = image.getWidth();
        int height = image.getHeight();

        int maxWidth = properties.getSteganography().getMaxImageWidth();
        int maxHeight = properties.getSteganography().getMaxImageHeight();

        if (width <= 0 || height <= 0) {
            throw new InvalidCarrierException("Invalid image dimensions: " + width + "x" + height);
        }

        if (width > maxWidth || height > maxHeight) {
            throw new InvalidCarrierException(
                    String.format("Image dimensions (%dx%d) exceed maximum supported dimensions (%dx%d)",
                            width, height, maxWidth, maxHeight)
            );
        }
    }
}
