import {
  projectRepository,
  type Project,
  type ProjectWithCounts,
  type CreateProjectDTO,
  type UpdateProjectDTO,
} from "../repositories";

export interface ServiceError {
  code: string;
  message: string;
}

type Result<T> = { success: true; data: T } | { success: false; error: ServiceError };

export interface CreateProjectInput {
  name: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  isDefault?: boolean;
}

export class ProjectService {
  create(userId: string, input: CreateProjectInput): Result<Project> {
    if (!input.name || input.name.trim().length === 0) {
      return {
        success: false,
        error: { code: "INVALID_NAME", message: "Project name is required" },
      };
    }

    if (input.name.length > 100) {
      return {
        success: false,
        error: { code: "INVALID_NAME", message: "Project name must be 100 characters or less" },
      };
    }

    if (projectRepository.nameExists(userId, input.name.trim())) {
      return {
        success: false,
        error: { code: "NAME_EXISTS", message: "A project with this name already exists" },
      };
    }

    const isFirstProject = projectRepository.findByUserId(userId).length === 0;

    const project = projectRepository.create({
      userId,
      name: input.name.trim(),
      description: input.description?.trim(),
      isDefault: input.isDefault ?? isFirstProject,
    });

    return { success: true, data: project };
  }

  update(projectId: string, userId: string, input: UpdateProjectInput): Result<Project> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to update this project" },
      };
    }

    if (input.name !== undefined) {
      if (input.name.trim().length === 0) {
        return {
          success: false,
          error: { code: "INVALID_NAME", message: "Project name is required" },
        };
      }

      if (input.name.length > 100) {
        return {
          success: false,
          error: { code: "INVALID_NAME", message: "Project name must be 100 characters or less" },
        };
      }

      if (projectRepository.nameExists(userId, input.name.trim(), projectId)) {
        return {
          success: false,
          error: { code: "NAME_EXISTS", message: "A project with this name already exists" },
        };
      }
    }

    const updateData: UpdateProjectDTO = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.description !== undefined) updateData.description = input.description.trim();
    if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;

    if (input.isDefault === true) {
      projectRepository.setDefault(userId, projectId);
    }

    const project = projectRepository.update(projectId, updateData);

    if (!project) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      };
    }

    return { success: true, data: project };
  }

  delete(projectId: string, userId: string): Result<{ deleted: boolean }> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to delete this project" },
      };
    }

    const deleted = projectRepository.delete(projectId);

    if (!deleted) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      };
    }

    return { success: true, data: { deleted: true } };
  }

  getById(projectId: string, userId: string): Result<Project> {
    const project = projectRepository.findById(projectId);

    if (!project) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      };
    }

    if (project.user_id !== userId) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to view this project" },
      };
    }

    return { success: true, data: project };
  }

  getByUserId(userId: string): ProjectWithCounts[] {
    return projectRepository.findByUserIdWithCounts(userId);
  }

  getDefault(userId: string): Project | null {
    return projectRepository.findDefault(userId);
  }

  setDefault(projectId: string, userId: string): Result<Project> {
    if (!projectRepository.isOwner(projectId, userId)) {
      return {
        success: false,
        error: { code: "FORBIDDEN", message: "You don't have permission to modify this project" },
      };
    }

    projectRepository.setDefault(userId, projectId);
    const project = projectRepository.findById(projectId);

    if (!project) {
      return {
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" },
      };
    }

    return { success: true, data: project };
  }

  isOwner(projectId: string, userId: string): boolean {
    return projectRepository.isOwner(projectId, userId);
  }
}

export const projectService = new ProjectService();
