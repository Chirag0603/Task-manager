const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return null;
  const hasAccess = project.owner.equals(userId) || project.members.some(m => m.equals(userId));
  return hasAccess ? project : false;
};

// POST create task
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, project, assignedTo, status, priority, dueDate, tags } = req.body;
    const proj = await checkProjectAccess(project, req.user._id);
    if (proj === null) return res.status(404).json({ message: 'Project not found' });
    if (proj === false) return res.status(403).json({ message: 'Access denied' });
    if (req.user.role !== 'admin' && !proj.owner.equals(req.user._id))
      return res.status(403).json({ message: 'Only admins/owners can create tasks' });
    
    const task = await Task.create({
      title, description, project, assignedTo, status, priority, dueDate, tags,
      createdBy: req.user._id
    });
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET dashboard - all tasks for user
router.get('/dashboard', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    });
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });
    
    const now = new Date();
    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done').length,
    };
    res.json({ tasks, stats });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update task
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    
    const proj = await checkProjectAccess(task.project, req.user._id);
    if (!proj) return res.status(403).json({ message: 'Access denied' });
    
    // Members can only update status of their assigned tasks
    if (req.user.role !== 'admin' && !proj.owner.equals(req.user._id)) {
      if (!task.assignedTo || !task.assignedTo.equals(req.user._id))
        return res.status(403).json({ message: 'You can only update your assigned tasks' });
      const { status } = req.body;
      task.status = status || task.status;
    } else {
      Object.assign(task, req.body);
    }
    
    await task.save();
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');
    res.json(task);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE task (admin/owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    const proj = await Project.findById(task.project);
    if (!proj.owner.equals(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Admin/owner only' });
    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
