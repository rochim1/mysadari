const {
  validationResult
} = require('express-validator');
const {
  DrugSchedule,
  DrugConsumeTime
} = require('../models/index');
const moment = require('moment');
const momentz = require('moment-timezone');
const {
  Op
} = require('sequelize'); // Import Sequelize operators
const cronController = require('./cronController');

// Create DrugSchedule
const createDrugSchedule = async (req, res) => {
  const errors = validationResult(req);

  // If validation fails, return the errors
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      error: errors.array(),
    });
  }

  let {
    drug_name,
    dose,
    drug_unit,
    periode,
    choosen_days,
    consume_per_day,
    consume_regulation,
    first_date_consume,
    long_consume,
    activate_notive,
    note,
    // status
    id_user,
    day_number,
    consume_time
  } = req.body;

  if (!id_user) {
    id_user = req.user.id_user;
  }

  if (periode == "setiap_hari") {
    choosen_days = ''; // its mean all days name  
  }

  if (periode !== "setiap_hari" && choosen_days && choosen_days.length) {
    choosen_days = JSON.stringify(choosen_days);
  }

  if (consume_time && consume_time.length) {
    consume_time = JSON.stringify(consume_time);
  }

  try {
    let newDrugSchedule = await DrugSchedule.create({
      drug_name,
      dose,
      drug_unit,
      periode,
      choosen_days,
      consume_per_day,
      consume_regulation,
      first_date_consume,
      long_consume,
      activate_notive,
      note,
      // status
      id_user,
      day_number,
      consume_time
    });

    if (!first_date_consume) {
      // Assign a specific date if first_date_consume is not provided
      first_date_consume = moment().format('YYYY-MM-DD'); // Current date
    }

    if (!long_consume) {
      // Calculate the number of days from the first consumption date to the last day of the current month
      const last_day_of_month = moment().endOf('month'); // Get the last day of the current month
      long_consume = last_day_of_month.diff(moment(first_date_consume, 'YYYY-MM-DD'), 'days'); // Calculate the difference in days
    }

    consume_time = JSON.parse(consume_time)
    if (consume_time && consume_time.length && first_date_consume && long_consume) {
      const startDate = moment(first_date_consume, 'YYYY-MM-DD');
      // Get the current date
      const endDate = moment(first_date_consume, 'YYYY-MM-DD').add(parseInt(long_consume) - 1, 'days'); // Today's date

      // Create an array to store the dates
      let daysArray = [];

      // Loop through from the start date to the current date
      if (periode == 'setiap_hari') {
        for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, 'days')) {
          daysArray.push(date.format('YYYY-MM-DD'));
        }
      } else if (periode == 'hari_pilihan') {
        for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, 'days')) {
          const dayOfWeek = date.day(); // Get the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)

          let numberOfWeek = []
          let daysName = JSON.parse(choosen_days)
          if (daysName && daysName.length) {
            const days = {
              'minggu': 0, // Sunday
              'senin': 1, // Monday
              'selasa': 2, // Tuesday
              'rabu': 3, // Wednesday
              'kamis': 4, // Thursday
              'jumat': 5, // Friday
              'sabtu': 6 // Saturday
            };

            if (daysName && daysName.length) {
              daysName.forEach(dayName => {
                let numDay = days[dayName.toLowerCase()];
                if (numDay !== undefined) {
                  numberOfWeek.push(numDay);
                }
              });
            }
          }

          // Check if the day is Sunday (0), Monday (1), or Friday (5)
          if (numberOfWeek.includes(dayOfWeek)) {
            daysArray.push(date.format('YYYY-MM-DD'));
          }
        }
      }
      
      for (const date of daysArray) {
        for (const time of consume_time) {
          let drugConsumeList = await DrugConsumeTime.create({ // not using await
            id_drug_schedule: newDrugSchedule.id_drug_schedule,
            name: newDrugSchedule.drug_name,
            time: time,
            id_user: id_user,
            date: date,
            is_consumed: false
          })

          const drugConsumeTime = momentz(`${date} ${time}`, 'YYYY-MM-DD HH:mm').startOf('minute');
          const currentTime = moment().startOf('minute'); 
          drugConsumeList.date = date;
          drugConsumeList.time = time;
          
          if (drugConsumeTime.isSameOrAfter(currentTime)) {
            cronController.scheduleNotification(drugConsumeList, 'drug_consume_time');
          }
        }
      }
    }
    newDrugSchedule.consume_time = newDrugSchedule.consume_time ? JSON.parse(newDrugSchedule.consume_time) : [];
    newDrugSchedule.choosen_days = newDrugSchedule.choosen_days ? JSON.parse(newDrugSchedule.choosen_days) : [];
    return res.status(201).json({
      success: true,
      message: 'Drug schedule created successfully',
      data: newDrugSchedule
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
    });
  }
};

// Update DrugSchedule
const updateDrugSchedule = async (req, res) => {
  const errors = validationResult(req);

  const {
    id_drug_schedule
  } = req.params;

  // If validation fails, return the errors
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      code: "BAD_REQUEST",
      error: errors.array(),
    });
  }

  let {
    drug_name,
    dose,
    drug_unit,
    periode,
    choosen_days,
    consume_per_day,
    consume_regulation,
    first_date_consume,
    long_consume,
    activate_notive,
    note,
    id_user,
    day_number,
    consume_time,
    reset_all_times
  } = req.body;

  if (!id_user) {
    id_user = req.user.id_user;
  }

  if (periode == "setiap_hari") {
    choosen_days = ''; // it means all days are chosen
  }

  if (periode !== "setiap_hari" && choosen_days && choosen_days.length) {
    choosen_days = JSON.stringify(choosen_days);
  }

  if (consume_time && consume_time.length) {
    consume_time = JSON.stringify(consume_time);
  }

  try {
    // Find the existing schedule by id
    let existingDrugSchedule = await DrugSchedule.findOne({
      where: {
        id_drug_schedule,
        id_user,
        status: 'active'
      }
    });

    if (!existingDrugSchedule) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: "Drug schedule not found",
      });
    }

    // Update the drug schedule details
    await existingDrugSchedule.update({
      drug_name,
      dose,
      drug_unit,
      periode,
      choosen_days,
      consume_per_day,
      consume_regulation,
      first_date_consume,
      long_consume,
      activate_notive,
      note,
      day_number,
      consume_time
    });

    consume_time = JSON.parse(consume_time);
    if (consume_time && consume_time.length && first_date_consume && long_consume) {
      const startDate = moment(first_date_consume, 'YYYY-MM-DD');
      const endDate = moment(first_date_consume, 'YYYY-MM-DD').add(parseInt(long_consume) - 1, 'days');

      let daysArray = [];

      if (periode == 'setiap_hari') {
        for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, 'days')) {
          daysArray.push(date.format('YYYY-MM-DD'));
        }
      } else if (periode == 'hari_pilihan') {
        for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, 'days')) {
          const dayOfWeek = date.day();

          let numberOfWeek = [];
          let daysName = JSON.parse(choosen_days);
          if (daysName && daysName.length) {
            const days = {
              'minggu': 0,
              'senin': 1,
              'selasa': 2,
              'rabu': 3,
              'kamis': 4,
              'jumat': 5,
              'sabtu': 6
            };

            daysName.forEach(dayName => {
              let numDay = days[dayName.toLowerCase()];
              if (numDay !== undefined) {
                numberOfWeek.push(numDay);
              }
            });
          }

          if (numberOfWeek.includes(dayOfWeek)) {
            daysArray.push(date.format('YYYY-MM-DD'));
          }
        }
      }

      const currentDrugConsume = await DrugConsumeTime.findAll({
        where: {
          id_drug_schedule: existingDrugSchedule.id_drug_schedule,
          status: 'active'
        },
        attributes: ['id_drug_consume_time'], // Specify the fields you want to retrieve
      });

      currentDrugConsume.map(consume => {
        cronController.stopScheduledJob(consume.id_drug_consume_time, 'drug_consume_time')
      });

      // Remove previous consume times before adding new ones
      if (reset_all_times) {
        await DrugConsumeTime.destroy({
          where: {
            id_drug_schedule
          }
        });
      } else {
        await DrugConsumeTime.destroy({
          where: {
            date: {
              [Op.in]: daysArray // Use square brackets to access `Op.in`
            },
            is_sent: false
          }
        });
      }

      for (const date of daysArray) {
        for (const time of consume_time) {
          await DrugConsumeTime.create({
            id_drug_schedule: existingDrugSchedule.id_drug_schedule,
            name: existingDrugSchedule.drug_name,
            time: time,
            id_user: id_user,
            date: date,
            is_consumed: false
          });
        }
      }

      const newCurrentDrugConsume = await DrugConsumeTime.findAll({
        where: {
          id_drug_schedule: existingDrugSchedule.id_drug_schedule,
          status: 'active'
        },
        attributes: ['id_drug_consume_time'], // Specify the fields you want to retrieve
      });

      newCurrentDrugConsume.map(consume => {

        const drugConsumeTime = momentz(`${consume.date} ${consume.time}`, 'YYYY-MM-DD HH:mm').startOf('minute');
        const currentTime = moment().startOf('minute'); // Ignore seconds and milliseconds for comparison

        if (drugConsumeTime.isSameOrAfter(currentTime)) {
          cronController.scheduleNotification(consume, 'drug_consume_time');
        }
      });

    }

    existingDrugSchedule.consume_time = existingDrugSchedule.consume_time ? JSON.parse(existingDrugSchedule.consume_time) : [];
    existingDrugSchedule.choosen_days = existingDrugSchedule.choosen_days ? JSON.parse(existingDrugSchedule.choosen_days) : [];

    return res.status(200).json({
      success: true,
      message: 'Drug schedule updated successfully',
      data: existingDrugSchedule
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
    });
  }
};


const getAllDrugSchedulesWithDate = async (req, res) => {
  try {
    const {
      page = 1, pageSize = 10
    } = req.body;

    const {
      status = 'active',
        id_user,
        drug_name,
        drug_unit,
        periode,
        choosen_days,
        consume_per_day,
        consume_regulation,
        date_consume
    } = req.body && req.body.filter ? req.body.filter : {};

    // if (!date_consume) {
    //   return res.status(400).json({
    //     success: false,
    //     code: "BAD_REQUEST",
    //     message: 'Date consume is required',
    //   });
    // }
    // Build the where clause with optional filters
    let whereClause = {
      status, // Include status in the filter by default
      ...(id_user && {
        id_user
      }),
      ...(drug_name && {
        drug_name: {
          [Op.like]: `%${drug_name}%`
        }
      }), // Partial match for drug_name
      ...(drug_unit && {
        drug_unit
      }),
      ...(periode && {
        periode
      }),
      ...(choosen_days && {
        choosen_days: {
          [Op.like]: `%${choosen_days}%`
        }
      }), // Partial match for choosen_days
      ...(consume_per_day && {
        consume_per_day
      }),
      ...(consume_regulation && {
        consume_regulation
      })
    };

    let whereClauseConsume = {
      status: 'active'
    };

    if (date_consume) {
      whereClauseConsume = {
        ...whereClauseConsume,
        date: {
          [Op.eq]: date_consume, // Condition where date is greater than 2024-08-01
        }
      }
    }

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // Fetch paginated drug schedules with count
    let {
      count,
      rows
    } = await DrugSchedule.findAndCountAll({
      where: whereClause,
      offset,
      limit,
      include: [{
        model: DrugConsumeTime,
        as: 'drug_consume_times', // Alias defined in the relationship
        where: whereClauseConsume
      }]
    });

    rows = rows.map(data => {
      return {
        id_drug_schedule: data.id_drug_schedule,
        drug_name: data.drug_name,
        dose: data.dose,
        drug_unit: data.drug_unit,
        periode: data.periode,
        consume_per_day: data.consume_per_day,
        consume_regulation: data.consume_regulation,
        first_date_consume: data.first_date_consume,
        long_consume: data.long_consume,
        activate_notif: data.activate_notif,
        note: data.note,
        day_number: data.day_number,
        id_user: data.id_user,
        status: data.status,
        deletedAt: data.deletedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        choosen_days: data.choosen_days ? JSON.parse(data.choosen_days) : [],
        consume_time: data.consume_time ? JSON.parse(data.consume_time) : [],
        drug_consume_times: data.drug_consume_times,
      }
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};

// Get all DrugSchedules
const getAllDrugSchedules = async (req, res) => {
  try {
    const {
      page = 1, pageSize = 10
    } = req.body;

    const {
      status = 'active',
        id_user,
        drug_name,
        drug_unit,
        periode,
        choosen_days,
        consume_per_day,
        consume_regulation
    } = req.body && req.body.filter ? req.body.filter : {};

    // Build the where clause with optional filters
    let whereClause = {
      status, // Include status in the filter by default
      ...(id_user && {
        id_user
      }),
      ...(drug_name && {
        drug_name: {
          [Op.like]: `%${drug_name}%`
        }
      }), // Partial match for drug_name
      ...(drug_unit && {
        drug_unit
      }),
      ...(periode && {
        periode
      }),
      ...(choosen_days && {
        choosen_days: {
          [Op.like]: `%${choosen_days}%`
        }
      }), // Partial match for choosen_days
      ...(consume_per_day && {
        consume_per_day
      }),
      ...(consume_regulation && {
        consume_regulation
      })
    };

    const offset = (page - 1) * pageSize;
    const limit = parseInt(pageSize);

    // Fetch paginated drug schedules with count
    let {
      count,
      rows
    } = await DrugSchedule.findAndCountAll({
      where: whereClause,
      offset,
      limit,
    });

    rows = rows.map(data => {
      return {
        id_drug_schedule: data.id_drug_schedule,
        drug_name: data.drug_name,
        dose: data.dose,
        drug_unit: data.drug_unit,
        periode: data.periode,
        consume_per_day: data.consume_per_day,
        consume_regulation: data.consume_regulation,
        first_date_consume: data.first_date_consume,
        long_consume: data.long_consume,
        activate_notif: data.activate_notif,
        note: data.note,
        day_number: data.day_number,
        id_user: data.id_user,
        status: data.status,
        deletedAt: data.deletedAt,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        choosen_days: data.choosen_days ? JSON.parse(data.choosen_days) : [],
        consume_time: data.consume_time ? JSON.parse(data.consume_time) : [],
        drug_consume_times: data.drug_consume_times,
      }
    });

    return res.status(200).json({
      success: true,
      totalItems: count,
      totalPages: Math.ceil(count / pageSize),
      currentPage: parseInt(page),
      data: rows
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: {
        message: error.message,
      },
    });
  }
};


// Get a specific DrugSchedule by ID
const getOneDrugSchdules = async (req, res) => {
  const {
    id_drug_schedule
  } = req.params;

  try {
    let drugSchedule = await DrugSchedule.findOne({
      where: {
        id_drug_schedule,
        status: "active",
      },
    });

    if (!drugSchedule) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: 'Drug schedule not found',
      });
    }
    drugSchedule.consume_time = drugSchedule.consume_time ? JSON.parse(drugSchedule.consume_time) : []
    drugSchedule.choosen_days = drugSchedule.choosen_days ? JSON.parse(drugSchedule.choosen_days) : []
    return res.status(200).json({
      success: true,
      message: 'Drug schedule retrieved successfully',
      data: drugSchedule
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
    });
  }
};

// Soft-delete a DrugSchedule by ID (update the status to 'deleted')
const deleteDrugSchedule = async (req, res) => {
  const {
    id_drug_schedule
  } = req.params;

  try {
    // Find the active drug schedule
    const drugSchedule = await DrugSchedule.findOne({
      where: {
        id_drug_schedule,
        status: "active",
      },
    });

    if (!drugSchedule) {
      return res.status(404).json({
        success: false,
        code: "NOT_FOUND",
        message: 'Drug schedule not found',
      });
    }

    // Soft-delete the drug schedule by updating its status and adding a timestamp to deletedAt
    await drugSchedule.update({
      status: 'deleted',
      deletedAt: new Date(),
    });

    // Soft-delete the related drug consume times by updating their status and deletedAt
    await DrugConsumeTime.update({
      status: 'deleted',
      deletedAt: new Date(),
    }, {
      where: {
        id_drug_schedule: id_drug_schedule
      }
    });

    const currentDrugConsume = await DrugConsumeTime.findAll({
      where: {
        id_drug_schedule: id_drug_schedule,
        status: 'deleted'
      },
      attributes: ['id_drug_consume_time'], // Specify the fields you want to retrieve
    });

    currentDrugConsume.map(consume => {
      cronController.stopScheduledJob(consume.id_drug_consume_time, 'drug_consume_time')
    });

    return res.status(200).json({
      success: true,
      message: 'Drug schedule and related consume times deleted successfully',
      data: drugSchedule
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      error: error.message,
    });
  }
};


module.exports = {
  createDrugSchedule,
  updateDrugSchedule,
  getAllDrugSchedules,
  getOneDrugSchdules,
  deleteDrugSchedule,
  getAllDrugSchedulesWithDate
}