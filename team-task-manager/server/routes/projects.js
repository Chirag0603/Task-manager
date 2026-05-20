const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

// GET all projects for user
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ owner: req.user._id }, { members: req.user._id }]
    }).populate('owner', 'name email').populate('members', 'name email');
    res.json(projects);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// POST create project (admin only)
router.post('/', protect, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
  try {
    const { name, description, members, deadline, color } = req.body;
    const project = await Project.create({
      name, description, owner: req.user._id,
      members: members || [], deadline, color
    });
    await project.populate('owner', 'name email');
    res.status(201).json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET single project
router.get('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const canAccess = project.owner._id.equals(req.user._id) || 
      project.members.some(m => m._id.equals(req.user._id));
    if (!canAccess) return res.status(403).json({ message: 'Access denied' });
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// PUT update project (owner/admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    Object.assign(project, req.body);
    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');
    res.json(project);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// DELETE project (owner/admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.owner.equals(req.user._id) && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// GET project tasks
router.get('/:id/tasks', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
