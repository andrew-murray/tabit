import React from 'react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

const signedIntegerRegex = /^-?\d*$/;

function clampValue(value, min, max)
{
  let next = value;
  if (!Number.isNaN(min))
  {
    next = Math.max(min, next);
  }
  if (!Number.isNaN(max))
  {
    next = Math.min(max, next);
  }
  return next;
}

function parseInteger(value)
{
  if (value === "" || value === "-")
  {
    return 0;
  }
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export default function PitchShiftField({
  label,
  value,
  onChange,
  min = NaN,
  max = NaN
})
{
  const [fieldValue, setFieldValue] = React.useState(String(value));

  React.useEffect(() => {
    setFieldValue(String(value));
  }, [value]);

  const commitValue = (nextValue) => {
    const clamped = clampValue(nextValue, min, max);
    setFieldValue(String(clamped));
    onChange(clamped);
  };

  const step = (delta) => {
    commitValue(value + delta);
  };

  const handleChange = (e) => {
    const inputValue = e.target.value;
    if (!inputValue.match(signedIntegerRegex))
    {
      return;
    }
    setFieldValue(inputValue);
  };

  const handleBlur = () => {
    commitValue(parseInteger(fieldValue));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter")
    {
      e.preventDefault();
      commitValue(parseInteger(fieldValue));
    }
  };

  return (
    <FormControl variant="standard" fullWidth>
      <FormLabel>{label}</FormLabel>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
        <IconButton
          aria-label="decrease pitch shift"
          onClick={() => step(-1)}
          size="small"
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <TextField
          value={fieldValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          size="small"
          inputProps={{
            inputMode: "numeric",
            style: { textAlign: "center" }
          }}
          sx={{ width: "4rem" }}
        />
        <IconButton
          aria-label="increase pitch shift"
          onClick={() => step(1)}
          size="small"
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
    </FormControl>
  );
}
