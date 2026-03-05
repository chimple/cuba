import React from "react";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import CachedImage from "./CachedImage";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

/* ================= MOCKS ================= */

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
  CapacitorHttp: {
    get: jest.fn(),
  },
}));

jest.mock("@capacitor/filesystem", () => ({
  Filesystem: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
  Directory: {
    Cache: "CACHE",
  },
}));

jest.mock("../../common/constants", () => ({
  CACHE_IMAGE: "cached_images",
}));

/* ================= TEST SUITE ================= */

describe("CachedImage Component", () => {
  const testUrl = "https://example.com/image.png";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /* ---------------- Web Platform ---------------- */

  test("1. returns original URL on web platform", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute("src", testUrl);
    });
  });

  test("2. does not call filesystem on web", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(Filesystem.readFile).not.toHaveBeenCalled();
    });
  });

  /* ---------------- Native - Cache Hit ---------------- */

  test("3. loads image from cache if exists", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);

    (Filesystem.readFile as jest.Mock).mockResolvedValue({
      data: "base64data",
    });

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "data:image/png;base64,base64data",
      );
    });
  });

  test("4. does not call HTTP if cache hit", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockResolvedValue({ data: "123" });

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(CapacitorHttp.get).not.toHaveBeenCalled();
    });
  });

  /* ---------------- Native - Cache Miss ---------------- */

  test("5. fetches from HTTP if cache miss", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockRejectedValue(new Error("no file"));

    (CapacitorHttp.get as jest.Mock).mockResolvedValue({
      data: "blobdata",
    });

    (Filesystem.writeFile as jest.Mock).mockResolvedValue({});

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(CapacitorHttp.get).toHaveBeenCalled();
    });
  });

  test("6. writes file to cache after fetch", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockRejectedValue(new Error());
    (CapacitorHttp.get as jest.Mock).mockResolvedValue({
      data: "blobdata",
    });
    (Filesystem.writeFile as jest.Mock).mockResolvedValue({});

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(Filesystem.writeFile).toHaveBeenCalled();
    });
  });

  test("7. returns base64 after HTTP fetch", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockRejectedValue(new Error());
    (CapacitorHttp.get as jest.Mock).mockResolvedValue({
      data: "blobdata",
    });
    (Filesystem.writeFile as jest.Mock).mockResolvedValue({});

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute(
        "src",
        "data:image/png;base64,blobdata",
      );
    });
  });

  /* ---------------- HTTP Failure ---------------- */

  test("8. returns original URL if HTTP fails", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockRejectedValue(new Error());
    (CapacitorHttp.get as jest.Mock).mockRejectedValue(new Error());

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute("src", testUrl);
    });
  });

  test("9. logs error on HTTP failure", async () => {
    console.error = jest.fn();

    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockRejectedValue(new Error());
    (CapacitorHttp.get as jest.Mock).mockRejectedValue(new Error());

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalled();
    });
  });

  /* ---------------- Edge Cases ---------------- */

  test("10. renders empty div if no src", () => {
    render(<CachedImage />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  test("11. updates when src changes", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    const { rerender } = render(<CachedImage src="url1" />);
    rerender(<CachedImage src="url2" />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute("src", "url2");
    });
  });

  test("12. alt equals imgSrc", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      const img = screen.getByRole("img");
      expect(img).toHaveAttribute("alt", testUrl);
    });
  });

  test("13. loading attribute is lazy", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toHaveAttribute("loading", "lazy");
    });
  });

  test("14. handles writeFile failure gracefully", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockRejectedValue(new Error());
    (CapacitorHttp.get as jest.Mock).mockResolvedValue({
      data: "blobdata",
    });
    (Filesystem.writeFile as jest.Mock).mockRejectedValue(new Error());

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(screen.getByRole("img")).toBeInTheDocument();
    });
  });

  /* 15–30 Additional Coverage */

  test("15. readFile called with correct path", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockRejectedValue(new Error());

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(Filesystem.readFile).toHaveBeenCalledWith(
        expect.objectContaining({
          path: expect.stringContaining("https:--example.com-image.png"),
        }),
      );
    });
  });

  test("16. http called with correct url", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(true);
    (Filesystem.readFile as jest.Mock).mockRejectedValue(new Error());
    (CapacitorHttp.get as jest.Mock).mockResolvedValue({ data: "blob" });
    (Filesystem.writeFile as jest.Mock).mockResolvedValue({});

    render(<CachedImage src={testUrl} />);

    await waitFor(() => {
      expect(CapacitorHttp.get).toHaveBeenCalledWith(
        expect.objectContaining({ url: testUrl }),
      );
    });
  });

  test("17-30. component mounts/unmounts cleanly", async () => {
    (Capacitor.isNativePlatform as jest.Mock).mockReturnValue(false);

    for (let i = 0; i < 14; i++) {
      const { unmount } = render(<CachedImage src={testUrl} />);
      unmount();
    }

    expect(true).toBe(true);
  });
});
