import prisma from '../config/database.js';

export const getPatients = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (page - 1) * limit;
    
    const where = search ? {
      OR: [
        { fullName: { contains: search, mode: 'insensitive' } },
        { nationalId: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ]
    } : {};
    
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        include: {
          caregivers: {
            include: { user: { select: { id: true, fullName: true, email: true } } }
          },
          deviceLinks: {
            where: { isActive: true },
            include: { device: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.patient.count({ where })
    ]);
    
    res.json({
      patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getPatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        caregivers: {
          include: { user: { select: { id: true, fullName: true, email: true, phone: true } } }
        },
        deviceLinks: {
          where: { isActive: true },
          include: { device: true }
        },
        prescriptions: {
          where: { isActive: true },
          include: { medication: true }
        }
      }
    });
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json({ patient });
  } catch (error) {
    next(error);
  }
};

export const createPatient = async (req, res, next) => {
  try {
    const {
      fullName, dateOfBirth, gender, nationalId, phone, email,
      address, county, ward, nextOfKinName, nextOfKinPhone,
      diagnoses, allergies, notes, photoUrl
    } = req.body;
    
    const patient = await prisma.patient.create({
      data: {
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        nationalId,
        phone,
        email,
        address,
        county,
        ward,
        nextOfKinName,
        nextOfKinPhone,
        diagnoses: diagnoses || [],
        allergies: allergies || [],
        notes,
        photoUrl,
        createdById: req.user.userId
      }
    });
    
    // Auto-assign creator as primary caregiver
    await prisma.patientCaregiver.create({
      data: {
        patientId: patient.id,
        userId: req.user.userId,
        isPrimary: true
      }
    });
    
    res.status(201).json({ patient });
  } catch (error) {
    next(error);
  }
};

export const updatePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    
    if (data.dateOfBirth) {
      data.dateOfBirth = new Date(data.dateOfBirth);
    }
    
    const patient = await prisma.patient.update({
      where: { id },
      data
    });
    
    res.json({ patient });
  } catch (error) {
    next(error);
  }
};

export const deletePatient = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await prisma.patient.update({
      where: { id },
      data: { isActive: false }
    });
    
    res.json({ message: 'Patient deactivated' });
  } catch (error) {
    next(error);
  }
};

export const getPatientAdherence = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const events = await prisma.doseEvent.findMany({
      where: {
        patientId: id,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    const taken = events.filter(e => e.eventType === 'DOSE_TAKEN').length;
    const missed = events.filter(e => e.eventType === 'DOSE_MISSED').length;
    const total = taken + missed;
    const adherenceRate = total > 0 ? (taken / total * 100).toFixed(1) : 0;
    
    res.json({
      adherenceRate,
      dosesTaken: taken,
      dosesMissed: missed,
      totalDoses: total,
      events
    });
  } catch (error) {
    next(error);
  }
};

export const assignCaregiver = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, isPrimary } = req.body;
    
    const assignment = await prisma.patientCaregiver.create({
      data: {
        patientId: id,
        userId,
        isPrimary: isPrimary || false
      }
    });
    
    res.status(201).json({ assignment });
  } catch (error) {
    next(error);
  }
};

export const removeCaregiver = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    
    await prisma.patientCaregiver.deleteMany({
      where: {
        patientId: id,
        userId
      }
    });
    
    res.json({ message: 'Caregiver removed' });
  } catch (error) {
    next(error);
  }
};
