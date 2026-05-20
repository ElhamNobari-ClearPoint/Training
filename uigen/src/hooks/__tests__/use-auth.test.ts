import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, cleanup } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

import { signIn as signInAction, signUp as signUpAction } from "@/actions";
import { getAnonWorkData, clearAnonWork } from "@/lib/anon-work-tracker";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

const mockSignIn = vi.mocked(signInAction);
const mockSignUp = vi.mocked(signUpAction);
const mockGetAnonWorkData = vi.mocked(getAnonWorkData);
const mockClearAnonWork = vi.mocked(clearAnonWork);
const mockGetProjects = vi.mocked(getProjects);
const mockCreateProject = vi.mocked(createProject);

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" } as any);
});

afterEach(() => {
  cleanup();
});

describe("useAuth — initial state", () => {
  test("isLoading starts as false", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isLoading).toBe(false);
  });

  test("exposes signIn, signUp, and isLoading", () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.signIn).toBe("function");
    expect(typeof result.current.signUp).toBe("function");
    expect(typeof result.current.isLoading).toBe("boolean");
  });
});

describe("signIn — happy path", () => {
  test("calls signInAction with correct credentials", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockSignIn).toHaveBeenCalledWith("user@example.com", "password123");
  });

  test("returns the result from signInAction", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "password123");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("sets isLoading to true during execution then false after", async () => {
    let loadingDuringCall = false;
    mockSignIn.mockImplementation(async () => {
      loadingDuringCall = true;
      return { success: false };
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(loadingDuringCall).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  test("resets isLoading to false after successful signIn", async () => {
    mockSignIn.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("signIn — error states", () => {
  test("returns error result without redirecting when signIn fails", async () => {
    mockSignIn.mockResolvedValue({ success: false, error: "Invalid credentials" });
    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signIn("user@example.com", "wrong");
    });

    expect(returnValue).toEqual({ success: false, error: "Invalid credentials" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("resets isLoading to false even when signIn action throws", async () => {
    mockSignIn.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn("user@example.com", "password123");
      } catch {
        // expected
      }
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("signUp — happy path", () => {
  test("calls signUpAction with correct credentials", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "securepass");
    });

    expect(mockSignUp).toHaveBeenCalledWith("new@example.com", "securepass");
  });

  test("returns the result from signUpAction", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signUp("new@example.com", "securepass");
    });

    expect(returnValue).toEqual({ success: true });
  });

  test("resets isLoading to false after successful signUp", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "securepass");
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("signUp — error states", () => {
  test("returns error result without redirecting when signUp fails", async () => {
    mockSignUp.mockResolvedValue({ success: false, error: "Email already registered" });
    const { result } = renderHook(() => useAuth());

    let returnValue: any;
    await act(async () => {
      returnValue = await result.current.signUp("existing@example.com", "pass1234");
    });

    expect(returnValue).toEqual({ success: false, error: "Email already registered" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  test("resets isLoading to false even when signUp action throws", async () => {
    mockSignUp.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signUp("new@example.com", "securepass");
      } catch {
        // expected
      }
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe("handlePostSignIn — anonymous work exists", () => {
  test("creates project from anon work when messages are present", async () => {
    const anonWork = {
      messages: [{ role: "user", content: "hello" }],
      fileSystemData: { "/": null },
    };
    mockGetAnonWorkData.mockReturnValue(anonWork);
    mockSignIn.mockResolvedValue({ success: true });
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: anonWork.messages,
        data: anonWork.fileSystemData,
      })
    );
  });

  test("clears anon work after creating project", async () => {
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "hello" }],
      fileSystemData: {},
    });
    mockSignIn.mockResolvedValue({ success: true });
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockClearAnonWork).toHaveBeenCalled();
  });

  test("redirects to the newly created project after anon work", async () => {
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "hello" }],
      fileSystemData: {},
    });
    mockSignIn.mockResolvedValue({ success: true });
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/anon-project-id");
  });

  test("does not call getProjects when anon work exists with messages", async () => {
    mockGetAnonWorkData.mockReturnValue({
      messages: [{ role: "user", content: "hello" }],
      fileSystemData: {},
    });
    mockSignIn.mockResolvedValue({ success: true });
    mockCreateProject.mockResolvedValue({ id: "anon-project-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockGetProjects).not.toHaveBeenCalled();
  });
});

describe("handlePostSignIn — no anonymous work, existing projects", () => {
  test("redirects to the most recent project when projects exist", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockSignIn.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([
      { id: "project-1" },
      { id: "project-2" },
    ] as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/project-1");
  });

  test("does not create a new project when existing projects are found", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockSignIn.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([{ id: "project-1" }] as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockCreateProject).not.toHaveBeenCalled();
  });
});

describe("handlePostSignIn — no anonymous work, no existing projects", () => {
  test("creates a new blank project when no projects exist", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockSignIn.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "fresh-project-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockCreateProject).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [],
        data: {},
      })
    );
  });

  test("redirects to newly created project when no projects exist", async () => {
    mockGetAnonWorkData.mockReturnValue(null);
    mockSignIn.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([]);
    mockCreateProject.mockResolvedValue({ id: "fresh-project-id" } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockPush).toHaveBeenCalledWith("/fresh-project-id");
  });
});

describe("handlePostSignIn — anon work edge cases", () => {
  test("treats empty messages array as no anon work", async () => {
    mockGetAnonWorkData.mockReturnValue({
      messages: [],
      fileSystemData: { "/": null },
    });
    mockSignIn.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([{ id: "existing-id" }] as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockGetProjects).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/existing-id");
  });

  test("does not clear anon work when messages array is empty", async () => {
    mockGetAnonWorkData.mockReturnValue({
      messages: [],
      fileSystemData: {},
    });
    mockSignIn.mockResolvedValue({ success: true });
    mockGetProjects.mockResolvedValue([{ id: "existing-id" }] as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signIn("user@example.com", "password123");
    });

    expect(mockClearAnonWork).not.toHaveBeenCalled();
  });

  test("post-signIn flow also runs after successful signUp", async () => {
    mockSignUp.mockResolvedValue({ success: true });
    mockGetAnonWorkData.mockReturnValue(null);
    mockGetProjects.mockResolvedValue([{ id: "project-abc" }] as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signUp("new@example.com", "securepass");
    });

    expect(mockGetProjects).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/project-abc");
  });
});
