# Keep functional conversion below the date value interface

Pure conversion functions are the primary conversion seam, and the immutable `NepaliDate` value delegates to them. Making conversion delegate to class methods can retain unrelated class behavior in size-sensitive bundles; the functional core keeps conversion independently testable and importable while the `NepaliDate` class remains an optional ergonomic interface.
