import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schemas
const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100),
  description: z.string().max(500).optional(),
  template: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  collaborators: z.array(z.string()).optional().default([])
})

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z.record(z.any()).optional(),
  collaborators: z.array(z.string()).optional()
})

// Mock database for projects
class ProjectService {
  private static instance: ProjectService
  private projects: Map<string, any> = new Map()

  static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService()
    }
    return ProjectService.instance
  }

  createProject(data: any) {
    const projectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const project = {
      id: projectId,
      name: data.name,
      description: data.description || '',
      template: data.template || 'blank',
      userId: data.userId,
      collaborators: data.collaborators || [],
      settings: {
        resolution: '1080p',
        frameRate: 30,
        duration: 30,
        backgroundColor: '#000000'
      },
      layers: [],
      timeline: {
        tracks: [],
        duration: 30,
        currentTime: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    }

    this.projects.set(projectId, project)
    return project
  }

  getProject(projectId: string) {
    return this.projects.get(projectId)
  }

  updateProject(projectId: string, updates: any) {
    const project = this.projects.get(projectId)
    if (!project) return null

    const updatedProject = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString()
    }

    this.projects.set(projectId, updatedProject)
    return updatedProject
  }

  deleteProject(projectId: string) {
    return this.projects.delete(projectId)
  }

  getUserProjects(userId: string) {
    return Array.from(this.projects.values())
      .filter(project => 
        project.userId === userId || 
        project.collaborators.includes(userId)
      )
  }

  addCollaborator(projectId: string, userId: string) {
    const project = this.projects.get(projectId)
    if (!project) return null

    if (!project.collaborators.includes(userId)) {
      project.collaborators.push(userId)
      project.updatedAt = new Date().toISOString()
      this.projects.set(projectId, project)
    }

    return project
  }

  removeCollaborator(projectId: string, userId: string) {
    const project = this.projects.get(projectId)
    if (!project) return null

    project.collaborators = project.collaborators.filter(id => id !== userId)
    project.updatedAt = new Date().toISOString()
    this.projects.set(projectId, project)

    return project
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = CreateProjectSchema.parse(body)

    const projectService = ProjectService.getInstance()
    const project = projectService.createProject(validatedData)

    return NextResponse.json({
      success: true,
      data: project
    })

  } catch (error) {
    console.error('Create project error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const projectId = searchParams.get('projectId')

    const projectService = ProjectService.getInstance()

    if (projectId) {
      const project = projectService.getProject(projectId)
      if (!project) {
        return NextResponse.json({
          success: false,
          error: 'Project not found'
        }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: project
      })
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const projects = projectService.getUserProjects(userId)
    return NextResponse.json({
      success: true,
      data: projects
    })

  } catch (error) {
    console.error('Get projects error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}









