import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z.record(z.any()).optional(),
  collaborators: z.array(z.string()).optional(),
  layers: z.array(z.any()).optional(),
  timeline: z.any().optional()
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Import the service (in a real app, this would be a proper import)
    const { ProjectService } = await import('../../projects/route')
    const projectService = ProjectService.getInstance()
    
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

  } catch (error) {
    console.error('Get project error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    const body = await request.json()
    const validatedData = UpdateProjectSchema.parse(body)

    // Import the service
    const { ProjectService } = await import('../../projects/route')
    const projectService = ProjectService.getInstance()
    
    const updatedProject = projectService.updateProject(projectId, validatedData)
    
    if (!updatedProject) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedProject
    })

  } catch (error) {
    console.error('Update project error:', error)
    
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id
    
    // Import the service
    const { ProjectService } = await import('../../projects/route')
    const projectService = ProjectService.getInstance()
    
    const deleted = projectService.deleteProject(projectId)
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Project not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    })

  } catch (error) {
    console.error('Delete project error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}









