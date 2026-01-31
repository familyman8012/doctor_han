export const PlainElements = () => {
    return (
        <div className="p-8 space-y-8">
            <div>
                <h2 className="text-xl font-semibold mb-4">Plain HTML Elements</h2>
                <p className="text-gray-600 mb-6">
                    These are the default styles for plain HTML elements. Use these classes to quickly style basic forms
                    without custom components.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
                {/* Plain Input Examples */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Plain Input</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="plain">Default Input</label>
                            <input type="text" className="plain" placeholder="Enter text..." />
                        </div>

                        <div>
                            <label className="plain">With Helper Text</label>
                            <input type="email" className="plain" placeholder="email@example.com" />
                            <p className="helper-text">We&apos;ll never share your email.</p>
                        </div>

                        <div>
                            <label className="plain">With Error</label>
                            <input
                                type="text"
                                className="plain"
                                placeholder="Required field"
                                style={{ borderColor: "var(--color-error-300)" }}
                            />
                            <p className="error-text">This field is required</p>
                        </div>

                        <div>
                            <label className="plain">Disabled Input</label>
                            <input type="text" className="plain" placeholder="Disabled" disabled />
                        </div>

                        <div>
                            <label className="plain">Using .inp class</label>
                            <input type="text" className="inp" placeholder="Using .inp class" />
                        </div>
                    </div>
                </div>

                {/* Plain Select */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Plain Select</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="plain">Default Select</label>
                            <select className="plain">
                                <option>Option 1</option>
                                <option>Option 2</option>
                                <option>Option 3</option>
                            </select>
                        </div>

                        <div>
                            <label className="plain">Disabled Select</label>
                            <select className="plain" disabled>
                                <option>Disabled Option</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Plain Textarea */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Plain Textarea</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="plain">Default Textarea</label>
                            <textarea className="plain" placeholder="Enter your message..." rows={4} />
                        </div>

                        <div>
                            <label className="plain">Disabled Textarea</label>
                            <textarea className="plain" placeholder="Disabled" disabled rows={3} />
                        </div>
                    </div>
                </div>

                {/* Plain Checkbox */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Plain Checkbox</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="plain" />
                            <span>Default Checkbox</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="plain" defaultChecked />
                            <span>Checked Checkbox</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                            <input type="checkbox" className="plain" disabled />
                            <span>Disabled Checkbox</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                            <input type="checkbox" className="plain" disabled defaultChecked />
                            <span>Disabled Checked</span>
                        </label>
                    </div>
                </div>

                {/* Plain Radio */}
                <div>
                    <h3 className="text-lg font-medium mb-4">Plain Radio</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" className="plain" name="radio-group" />
                            <span>Option 1</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" className="plain" name="radio-group" defaultChecked />
                            <span>Option 2 (Selected)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" className="plain" name="radio-group" />
                            <span>Option 3</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-not-allowed opacity-50">
                            <input type="radio" className="plain" name="radio-group-disabled" disabled />
                            <span>Disabled Option</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Usage Example */}
            <div className="border-t pt-8">
                <h3 className="text-lg font-medium mb-4">Usage Example</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm">
                        {`<!-- Plain Input -->
<input type="text" class="plain" placeholder="Enter text..." />
<input type="text" class="inp" placeholder="Using .inp class" />

<!-- Plain Select -->
<select class="plain">
  <option>Option 1</option>
  <option>Option 2</option>
</select>

<!-- Plain Textarea -->
<textarea class="plain" placeholder="Message"></textarea>

<!-- Plain Checkbox -->
<input type="checkbox" class="plain" />

<!-- Plain Radio -->
<input type="radio" class="plain" name="group" />

<!-- With Label -->
<label class="plain">Label Text</label>
<input type="text" class="plain" />

<!-- Helper/Error Text -->
<p class="helper-text">Helper message</p>
<p class="error-text">Error message</p>`}
                    </pre>
                </div>
            </div>
        </div>
    );
};

PlainElements.displayName = "PlainElements";
